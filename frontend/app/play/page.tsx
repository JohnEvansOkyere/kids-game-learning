"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { CoinIcon, LogoMark } from "@/components/ui/Icons";
import CoinBurst from "@/components/world/CoinBurst";
import ModalSheet from "@/components/world/ModalSheet";
import RewardBurst from "@/components/world/RewardBurst";
import ShopSheet from "@/components/world/ShopSheet";
import ZoneScene from "@/components/world/ZoneScene";
import { Dock, GoalCard, WorldHud } from "@/components/world/WorldHud";
import { playChestOpenSFX, playChestShakeSFX, playCoinSFX, playUnlockSFX } from "@/app/practice/GameAudio";
import { worldApi, getErrorMessage } from "@/lib/api";
import { findCurrentNode, flushNodeCompletions, loadWorld, nodeHref, refreshOfflinePack } from "@/lib/world";
import { trackEvent } from "@/lib/events";
import { flushOfflineSessions } from "@/lib/offlineAnswers";
import type { ChestResponse, Student, World, WorldItem, WorldNode } from "@/lib/types";

type Modal = null | "shop" | "opening" | { chest: ChestResponse };

// Shortest chest shake, so the reveal feels earned even on a fast network
const CHEST_SHAKE_MS = 900;

function seenUnlockedKey(studentId: string) {
    return `seenUnlocked_${studentId}`;
}

/** Twi greeting for the time of day, with the English underneath */
function greetingFor(hour: number) {
    if (hour < 12) return { twi: "Maakye", en: "Good morning" };
    if (hour < 17) return { twi: "Maaha", en: "Good afternoon" };
    return { twi: "Maadwo", en: "Good evening" };
}

export default function PlayPage() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [world, setWorld] = useState<World | null>(null);
    const [error, setError] = useState("");
    const [modal, setModal] = useState<Modal>(null);
    const [busy, setBusy] = useState(false);
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
            void flushOfflineSessions();
            const loaded = await loadWorld(studentId);
            setWorld(loaded);
            setError("");

            const unlockedIds = loaded.zones.flatMap((z) => z.nodes).filter((n) => n.unlocked).map((n) => n.id);
            const seenRaw = localStorage.getItem(seenUnlockedKey(studentId));
            localStorage.setItem(seenUnlockedKey(studentId), JSON.stringify(unlockedIds));
            // First visit: everything is new, so nothing is celebrated
            const seen = new Set<string>(seenRaw ? JSON.parse(seenRaw) : unlockedIds);
            const fresh = unlockedIds.filter((id) => !seen.has(id));
            if (fresh.length) {
                setNewlyUnlocked(new Set(fresh));
                setTimeout(playUnlockSFX, 400);
            }
            // A new stage needs its questions on the phone before the data runs out
            void refreshOfflinePack(studentId, fresh.length > 0);
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
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
                <div className="animate-float">
                    <LogoMark size={72} />
                </div>
                <p className="font-display text-xl font-semibold text-ink-soft">Loading your adventure…</p>
            </div>
        );
    }

    const allNodes = world ? world.zones.flatMap((z) => z.nodes) : [];
    const currentNode = world ? findCurrentNode(world, student.gradeLevel) : null;
    const totalStars = allNodes.reduce((sum, n) => sum + n.stars, 0);
    const greeting = greetingFor(new Date().getHours());

    const playNode = (node: WorldNode) => {
        trackEvent(student.id, "node_start", { nodeId: node.id, from: "map" });
        router.push(nodeHref(node));
    };

    const goToCurrent = () => {
        if (currentNodeRef.current) {
            currentNodeRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="min-h-screen bg-background pb-40">
            <WorldHud
                student={student}
                world={world}
                totalStars={totalStars}
                onSwitchPlayer={() => router.push("/student/select")}
            />

            <div className="mx-auto max-w-[480px] px-5 pb-4 pt-5">
                <p className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                    {greeting.en}
                </p>
                <h1 className="font-display text-3xl font-semibold leading-tight text-ink">
                    {greeting.twi}, {student.name}! 👋
                </h1>
            </div>

            {world && (
                <GoalCard
                    world={world}
                    currentNode={currentNode}
                    openChest={openChest}
                    openShop={() => setModal("shop")}
                    playNode={playNode}
                />
            )}

            {error && (
                <div className="mx-auto mt-4 max-w-[480px] px-3">
                    <div className="rounded-2xl bg-danger/10 p-4 text-center ring-2 ring-danger/30">
                        <p className="font-semibold text-danger-dark">{error}</p>
                        {!world && (
                            <Button variant="primary" className="mt-3" onClick={() => refresh(student.id)}>
                                Try Again
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-6">
                {world?.zones.map((zone, zoneIndex) => (
                    <ZoneScene
                        key={zone.id}
                        zone={zone}
                        previousZone={zoneIndex > 0 ? world.zones[zoneIndex - 1] : null}
                        isFirst={zoneIndex === 0}
                        currentNode={currentNode}
                        newlyUnlocked={newlyUnlocked}
                        currentNodeRef={currentNodeRef}
                        avatar={<Avatar plate type={student.avatar} size="small" outfit={world.equippedItem?.emoji} />}
                        onPlay={playNode}
                    />
                ))}
            </div>

            <Dock
                chestAvailable={Boolean(world?.chestAvailable)}
                busy={busy}
                onMap={goToCurrent}
                onChest={openChest}
                onShop={() => setModal("shop")}
                onGames={() => router.push("/dashboard")}
            />

            {/* Chest opening */}
            {modal === "opening" && (
                <ModalSheet label="Opening your chest" dismissible={false} onClose={() => {}}>
                    <div className="px-6 py-14">
                        <p className="inline-block animate-chest-shake text-8xl">🎁</p>
                        <h2 className="mt-4 font-display text-3xl font-semibold text-ink">Opening…</h2>
                    </div>
                </ModalSheet>
            )}

            {/* Chest reward */}
            {modal && typeof modal === "object" && (
                <ModalSheet label="Daily chest reward" onClose={() => setModal(null)}>
                    <div className="relative overflow-hidden px-6 pb-7 pt-10">
                        <RewardBurst />
                        <div className="relative">
                            <h2 className="font-display text-3xl font-semibold text-ink">Daily Chest!</h2>
                            <p className="relative mt-4 inline-block font-display text-5xl font-semibold text-ink">
                                <span className="inline-flex animate-pop items-center gap-2">
                                    <CoinIcon size={52} />+{modal.chest.coinsEarned}
                                </span>
                                <CoinBurst />
                            </p>
                            {modal.chest.rewardItem && (
                                <div className="mx-auto mt-5 max-w-[15rem] animate-bounce-in rounded-3xl bg-secondary/20 p-4 ring-2 ring-secondary">
                                    <p className="text-6xl leading-none">{modal.chest.rewardItem.emoji}</p>
                                    <p className="mt-2 font-display text-xl font-semibold text-ink">
                                        You found {modal.chest.rewardItem.name}!
                                    </p>
                                </div>
                            )}
                            <p className="mt-5 text-sm font-semibold text-ink-muted">
                                Come back tomorrow for another chest!
                            </p>
                            <Button variant="success" fullWidth className="mt-5" onClick={() => setModal(null)}>
                                Yay!
                            </Button>
                        </div>
                    </div>
                </ModalSheet>
            )}

            {/* Shop and collection */}
            {modal === "shop" && world && (
                <ShopSheet
                    world={world}
                    avatar={student.avatar}
                    busy={busy}
                    error={error}
                    onBuyOrEquip={buyOrEquip}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
