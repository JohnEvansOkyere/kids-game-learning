"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import CoinBurst from "@/components/world/CoinBurst";
import { playChestOpenSFX, playChestShakeSFX, playCoinSFX, playUnlockSFX } from "@/app/practice/GameAudio";
import { worldApi, getErrorMessage } from "@/lib/api";
import { findCurrentNode, flushNodeCompletions, loadWorld, nodeHref, starString } from "@/lib/world";
import { trackEvent } from "@/lib/events";
import type { ChestResponse, Student, World, WorldItem, WorldNode, WorldZone } from "@/lib/types";

const ZONE_STYLES: Record<string, { bg: string; ring: string; title: string }> = {
    village: { bg: "from-amber-100 to-orange-200", ring: "border-orange-400", title: "text-orange-800" },
    farm: { bg: "from-lime-100 to-green-200", ring: "border-green-500", title: "text-green-800" },
    market: { bg: "from-yellow-100 to-amber-300", ring: "border-amber-500", title: "text-amber-900" },
    forest: { bg: "from-emerald-200 to-emerald-400", ring: "border-emerald-700", title: "text-emerald-900" },
    coast: { bg: "from-sky-100 to-cyan-300", ring: "border-cyan-600", title: "text-cyan-900" },
};

// Horizontal offsets that make the node path wind down the zone
const PATH_OFFSETS = ["0%", "-28%", "0%", "28%"];

type Modal = null | "shop" | "opening" | { chest: ChestResponse };

// Shortest chest shake, so the reveal feels earned even on a fast network
const CHEST_SHAKE_MS = 900;

function seenUnlockedKey(studentId: string) {
    return `seenUnlocked_${studentId}`;
}

export default function PlayPage() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [world, setWorld] = useState<World | null>(null);
    const [error, setError] = useState("");
    const [modal, setModal] = useState<Modal>(null);
    const [busy, setBusy] = useState(false);
    const [shopTab, setShopTab] = useState<"outfit" | "collectible">("outfit");
    // Nodes that opened since the child last saw the map, to animate once
    const [newlyUnlocked, setNewlyUnlocked] = useState<Set<string>>(new Set());
    const currentNodeRef = useRef<HTMLButtonElement | null>(null);
    const scrolledRef = useRef(false);
    const trackedOpenRef = useRef(false);

    useEffect(() => {
        const raw = localStorage.getItem("selectedStudent");
        if (!raw) {
            router.push("/student/select");
            return;
        }
        try {
            setStudent(JSON.parse(raw));
        } catch {
            router.push("/student/select");
        }
    }, [router]);

    const refresh = useCallback(async (studentId: string) => {
        try {
            await flushNodeCompletions();
            const loaded = await loadWorld(studentId);
            setWorld(loaded);
            setError("");

            const unlockedIds = loaded.zones.flatMap((z) => z.nodes).filter((n) => n.unlocked).map((n) => n.id);
            const seenRaw = localStorage.getItem(seenUnlockedKey(studentId));
            localStorage.setItem(seenUnlockedKey(studentId), JSON.stringify(unlockedIds));
            // First visit: everything is new, so nothing is celebrated
            if (seenRaw) {
                const seen = new Set<string>(JSON.parse(seenRaw));
                const fresh = unlockedIds.filter((id) => !seen.has(id));
                if (fresh.length) {
                    setNewlyUnlocked(new Set(fresh));
                    setTimeout(playUnlockSFX, 400);
                }
            }
        } catch (err) {
            setError(getErrorMessage(err));
        }
    }, []);

    useEffect(() => {
        if (!student) return;
        refresh(student.id);
        // Once per visit, even under strict-mode double effects
        if (!trackedOpenRef.current) {
            trackedOpenRef.current = true;
            trackEvent(student.id, "map_open");
        }
    }, [student, refresh]);

    // Bring the node the child should play next into view once
    useEffect(() => {
        if (world && !scrolledRef.current && currentNodeRef.current) {
            scrolledRef.current = true;
            currentNodeRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }, [world]);

    const openChest = async () => {
        if (!student || !world?.chestAvailable || busy) return;
        setBusy(true);
        setModal("opening");
        playChestShakeSFX();
        try {
            const [chest] = await Promise.all([
                worldApi.openChest(student.id),
                new Promise((resolve) => setTimeout(resolve, CHEST_SHAKE_MS)),
            ]);
            setModal({ chest });
            trackEvent(student.id, "chest_open", { coins: chest.coinsEarned, itemId: chest.rewardItem?.id ?? null });
            playChestOpenSFX();
            setTimeout(playCoinSFX, 400);
            await refresh(student.id);
        } catch (err) {
            setModal(null);
            setError(getErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const buyOrEquip = async (item: WorldItem) => {
        if (!student || busy) return;
        setBusy(true);
        setError("");
        try {
            if (!item.owned) {
                await worldApi.buyItem(student.id, item.id);
                trackEvent(student.id, "item_buy", { itemId: item.id });
            }
            if (item.kind === "outfit") {
                await worldApi.equipItem(student.id, item.id);
                trackEvent(student.id, "item_equip", { itemId: item.id });
            }
            await refresh(student.id);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    if (!student || (!world && !error)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-2xl text-gray-600">Loading your adventure... 🗺️</p>
            </div>
        );
    }

    const allNodes = world ? world.zones.flatMap((z) => z.nodes) : [];
    const currentNode = world ? findCurrentNode(world, student.gradeLevel) : null;
    const totalStars = allNodes.reduce((sum, n) => sum + n.stars, 0);

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg">
                <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-1 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/student/select")}
                        className="flex items-center gap-2 min-h-touch"
                        aria-label="Switch player"
                    >
                        <Avatar type={student.avatar} size="small" outfit={world?.equippedItem?.emoji} />
                        <span className="font-bold text-lg hidden sm:inline">{student.name}</span>
                    </button>

                    <div className="flex-1" />

                    <span className="hidden min-[360px]:inline bg-white/20 rounded-full px-2 sm:px-3 py-1 font-bold whitespace-nowrap">
                        ⭐ {totalStars}
                    </span>
                    <span
                        key={world?.coins}
                        className="bg-white/20 rounded-full px-2 sm:px-3 py-1 font-bold whitespace-nowrap animate-pop"
                    >
                        🪙 {world?.coins ?? 0}
                    </span>
                    <button
                        type="button"
                        onClick={openChest}
                        disabled={!world?.chestAvailable || busy}
                        className={`text-3xl min-h-touch min-w-touch rounded-2xl ${
                            world?.chestAvailable ? "animate-pulse-glow" : "opacity-40"
                        }`}
                        aria-label={world?.chestAvailable ? "Open daily chest" : "Chest opens again tomorrow"}
                        title={world?.chestAvailable ? "Open your daily chest!" : "Come back tomorrow!"}
                    >
                        🎁
                    </button>
                    <button
                        type="button"
                        onClick={() => setModal("shop")}
                        className="text-3xl min-h-touch min-w-touch rounded-2xl"
                        aria-label="Open shop"
                    >
                        🛍️
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="text-center mb-6">
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary">
                        {student.name}&apos;s Adventure 🇬🇭
                    </h1>
                    <p className="text-lg text-gray-600">Travel across Ghana with maths!</p>
                </div>

                {error && (
                    <div className="bg-danger/10 border-4 border-danger rounded-2xl p-4 mb-6 text-center">
                        <p className="text-danger font-bold">{error}</p>
                        {!world && (
                            <Button variant="primary" className="mt-3" onClick={() => refresh(student.id)}>
                                Try Again
                            </Button>
                        )}
                    </div>
                )}

                {world?.zones.map((zone, zoneIndex) => (
                    <ZoneSection
                        key={zone.id}
                        zone={zone}
                        previousZone={zoneIndex > 0 ? world.zones[zoneIndex - 1] : null}
                        currentNode={currentNode}
                        newlyUnlocked={newlyUnlocked}
                        currentNodeRef={currentNodeRef}
                        avatar={<Avatar type={student.avatar} size="small" outfit={world.equippedItem?.emoji} />}
                        onPlay={(node) => {
                            trackEvent(student.id, "node_start", { nodeId: node.id, from: "map" });
                            router.push(nodeHref(node));
                        }}
                    />
                ))}

                <div className="text-center mt-8 mb-4">
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="text-primary font-bold text-lg hover:underline"
                    >
                        🎮 Free Play (all games)
                    </button>
                </div>
            </div>

            {/* Chest opening */}
            {modal === "opening" && (
                <ModalShell onClose={() => {}}>
                    <p className="text-8xl mb-2 inline-block animate-chest-shake">🎁</p>
                    <h2 className="text-3xl font-bold text-primary">Opening...</h2>
                </ModalShell>
            )}

            {/* Chest reward */}
            {modal && typeof modal === "object" && (
                <ModalShell onClose={() => setModal(null)}>
                    <p className="text-7xl mb-2 animate-bounce-in">🎉</p>
                    <h2 className="text-3xl font-bold text-primary mb-2">Daily Chest!</h2>
                    <p className="relative text-3xl font-bold text-secondary-dark mb-4">
                        <span className="inline-block animate-pop">+{modal.chest.coinsEarned} 🪙</span>
                        <CoinBurst />
                    </p>
                    {modal.chest.rewardItem && (
                        <div className="bg-secondary/20 border-4 border-secondary rounded-2xl p-4 mb-4">
                            <p className="text-6xl">{modal.chest.rewardItem.emoji}</p>
                            <p className="text-xl font-bold text-primary">
                                You found {modal.chest.rewardItem.name}!
                            </p>
                        </div>
                    )}
                    <p className="text-gray-600 mb-4">Come back tomorrow for another chest!</p>
                    <Button variant="primary" onClick={() => setModal(null)}>
                        Yay! 🎉
                    </Button>
                </ModalShell>
            )}

            {/* Shop and collection */}
            {modal === "shop" && world && (
                <ModalShell onClose={() => setModal(null)}>
                    <h2 className="text-3xl font-bold text-primary mb-1">Shop 🛍️</h2>
                    <p className="text-xl font-bold text-secondary-dark mb-4">You have {world.coins} 🪙</p>

                    <div className="flex gap-2 justify-center mb-4">
                        {(["outfit", "collectible"] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setShopTab(tab)}
                                className={`px-4 min-h-touch rounded-2xl border-4 font-bold ${
                                    shopTab === tab ? "border-primary bg-primary text-white" : "border-gray-300"
                                }`}
                            >
                                {tab === "outfit" ? "👒 Outfits" : "🧺 My Collection"}
                            </button>
                        ))}
                    </div>

                    {error && <p className="text-danger font-bold mb-2">{error}</p>}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {world.items
                            .filter((item) => item.kind === shopTab)
                            .map((item) => {
                                const worn = world.equippedItem?.id === item.id;
                                const canAfford = item.price !== null && world.coins >= item.price;
                                const isOutfit = item.kind === "outfit";
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        disabled={busy || !isOutfit || (!item.owned && !canAfford)}
                                        onClick={() => buyOrEquip(item)}
                                        className={`rounded-2xl border-4 p-3 min-h-[120px] flex flex-col items-center justify-center transition-transform ${
                                            worn
                                                ? "border-success bg-success/10"
                                                : item.owned
                                                ? "border-primary bg-white hover:scale-105"
                                                : canAfford
                                                ? "border-secondary bg-white hover:scale-105"
                                                : "border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <span className={`text-5xl ${item.owned || isOutfit ? "" : "grayscale opacity-30"}`}>
                                            {item.owned || isOutfit ? item.emoji : "❓"}
                                        </span>
                                        <span className="font-bold text-sm mt-1">
                                            {item.owned || isOutfit ? item.name : "???"}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {isOutfit
                                                ? worn
                                                    ? "Wearing ✓"
                                                    : item.owned
                                                    ? "Tap to wear"
                                                    : `${item.price} 🪙`
                                                : item.owned
                                                ? "Collected ✓"
                                                : "Find it!"}
                                        </span>
                                    </button>
                                );
                            })}
                    </div>

                    {shopTab === "collectible" && (
                        <p className="text-gray-600 mb-4">
                            Beat zone bosses and open daily chests to find treasures!
                        </p>
                    )}

                    <Button variant="primary" onClick={() => setModal(null)}>
                        Close
                    </Button>
                </ModalShell>
            )}
        </div>
    );
}

function ZoneSection({
    zone,
    previousZone,
    currentNode,
    newlyUnlocked,
    currentNodeRef,
    avatar,
    onPlay,
}: {
    zone: WorldZone;
    previousZone: WorldZone | null;
    currentNode: WorldNode | null;
    newlyUnlocked: Set<string>;
    currentNodeRef: React.MutableRefObject<HTMLButtonElement | null>;
    avatar: React.ReactNode;
    onPlay: (node: WorldNode) => void;
}) {
    const style = ZONE_STYLES[zone.id] ?? ZONE_STYLES.village;
    const previousBoss = previousZone?.nodes[previousZone.nodes.length - 1];

    return (
        <section
            className={`relative rounded-3xl border-4 ${style.ring} bg-gradient-to-b ${style.bg} p-5 mb-6 shadow-lg ${
                zone.unlocked ? "" : "grayscale-[60%]"
            }`}
        >
            <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                    <h2 className={`text-2xl sm:text-3xl font-bold ${style.title}`}>
                        {zone.emoji} {zone.name}
                    </h2>
                    <p className="text-gray-700">{zone.description}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-bold text-gray-800">
                        ⭐ {zone.starsEarned}/{zone.starsTotal}
                    </p>
                    <p
                        className={`text-3xl ${zone.bossReward.owned ? "" : "grayscale opacity-40"}`}
                        title={zone.bossReward.owned ? zone.bossReward.name : "Beat the boss to win this!"}
                    >
                        {zone.bossReward.owned ? zone.bossReward.emoji : "🎁"}
                    </p>
                </div>
            </div>

            {!zone.unlocked && previousBoss && (
                <p className="text-center font-bold text-gray-800 bg-white/70 rounded-2xl py-2 mb-2">
                    🔒 Beat {previousBoss.title} to open this place!
                </p>
            )}

            <div className="flex flex-col items-center gap-2 py-2">
                {zone.nodes.map((node, i) => {
                    const isCurrent = currentNode?.id === node.id;
                    const isBoss = node.type === "boss";
                    const isNew = newlyUnlocked.has(node.id);
                    return (
                        <div
                            key={node.id}
                            className="flex flex-col items-center"
                            style={{ transform: `translateX(${PATH_OFFSETS[i % PATH_OFFSETS.length]})` }}
                        >
                            {i > 0 && <div className="h-4 border-l-4 border-dashed border-white/80 mb-2" />}
                            <div className="relative">
                                {isCurrent && (
                                    <div className="absolute -left-14 top-1/2 -translate-y-1/2 animate-bounce">{avatar}</div>
                                )}
                                {isNew && (
                                    <span aria-hidden className="absolute -top-4 -right-3 z-10 text-3xl animate-fade-up">
                                        🔓
                                    </span>
                                )}
                                {/* Wrapper so the unlock wiggle doesn't replace the button's glow */}
                                <div className={isNew ? "animate-unlock" : ""}>
                                    <button
                                        ref={isCurrent ? currentNodeRef : undefined}
                                        type="button"
                                        disabled={!node.unlocked}
                                        onClick={() => onPlay(node)}
                                        aria-label={`${node.title}${node.unlocked ? "" : " (locked)"}`}
                                        className={`rounded-full border-4 flex items-center justify-center shadow-md transition-transform ${
                                            isBoss ? "w-24 h-24 text-5xl" : "w-20 h-20 text-4xl"
                                        } ${
                                            !node.unlocked
                                                ? "bg-gray-300 border-gray-400 cursor-not-allowed"
                                                : node.stars > 0
                                                ? "bg-white border-success hover:scale-110"
                                                : isBoss
                                                ? "bg-ghana-red border-ghana-gold hover:scale-110"
                                                : "bg-secondary border-white hover:scale-110"
                                        } ${isCurrent ? "animate-pulse-glow scale-110" : ""}`}
                                    >
                                        {node.unlocked ? node.emoji : "🔒"}
                                    </button>
                                </div>
                            </div>
                            <p className="font-bold text-gray-800 text-sm mt-1 text-center max-w-[9rem]">
                                {isBoss && "BOSS: "}
                                {node.title}
                            </p>
                            {node.unlocked && <p className="text-sm leading-none">{starString(node.stars)}</p>}
                            {isCurrent && (
                                <span className="mt-1 bg-primary text-white font-bold text-sm rounded-full px-3 py-1">
                                    ▶ Play!
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-background rounded-3xl border-4 border-secondary shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto text-center animate-bounce-in"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
