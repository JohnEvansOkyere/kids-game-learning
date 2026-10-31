"use client";

/**
 * ShopSheet - dress-up first: the child sees their character wearing what they pick
 */
import React, { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { CheckIcon, CoinIcon } from "@/components/ui/Icons";
import ModalSheet from "@/components/world/ModalSheet";
import type { AvatarType, World, WorldItem } from "@/lib/types";

interface ShopSheetProps {
    world: World;
    avatar: AvatarType;
    busy: boolean;
    error: string;
    onBuyOrEquip: (item: WorldItem) => void;
    onClose: () => void;
}

export default function ShopSheet({ world, avatar, busy, error, onBuyOrEquip, onClose }: ShopSheetProps) {
    const [tab, setTab] = useState<"outfit" | "collectible">("outfit");
    const equipped = world.equippedItem;
    const items = world.items.filter((item) => item.kind === tab);

    return (
        <ModalSheet variant="sheet" onClose={onClose} label="Shop">
            <div className="px-5 pb-6 pt-5 sm:pt-6">
                <div className="flex items-center justify-between pr-12">
                    <h2 className="font-display text-3xl font-semibold text-ink">Shop</h2>
                    <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-secondary/25 pl-2 pr-3.5 font-display text-lg font-semibold text-ink">
                        <CoinIcon size={24} />
                        {world.coins}
                    </span>
                </div>

                {/* Live preview */}
                <div className="mt-4 flex flex-col items-center rounded-3xl bg-gradient-to-b from-primary/10 to-transparent pb-4 pt-8">
                    <Avatar plate type={avatar} size="large" outfit={equipped?.emoji} />
                    <p className="mt-3 font-display text-base font-semibold text-ink-soft">
                        {equipped ? `Wearing ${equipped.name}` : "Pick an outfit!"}
                    </p>
                </div>

                {/* Tabs */}
                <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-ink/5 p-1">
                    {(["outfit", "collectible"] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`min-h-[48px] rounded-xl font-display text-base font-semibold transition-colors ${
                                tab === t ? "bg-white text-ink shadow-lift" : "text-ink-muted"
                            }`}
                        >
                            {t === "outfit" ? "Outfits" : "My Collection"}
                        </button>
                    ))}
                </div>

                {error && <p className="mt-3 font-semibold text-danger-dark">{error}</p>}

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {items.map((item) => {
                        const worn = equipped?.id === item.id;
                        const canAfford = item.price !== null && world.coins >= item.price;
                        const isOutfit = item.kind === "outfit";
                        const revealed = item.owned || isOutfit;

                        const tone = worn
                            ? "bg-success/10 ring-success"
                            : item.owned
                            ? "bg-white ring-ink/15 active:scale-95"
                            : canAfford
                            ? "bg-secondary/15 ring-secondary active:scale-95"
                            : "bg-ink/5 ring-transparent";

                        return (
                            <button
                                key={item.id}
                                type="button"
                                disabled={busy || !isOutfit || (!item.owned && !canAfford)}
                                onClick={() => onBuyOrEquip(item)}
                                className={`relative flex min-h-[8.75rem] flex-col items-center justify-center gap-1 rounded-3xl p-3 text-center ring-2 transition-transform disabled:cursor-not-allowed ${tone}`}
                            >
                                {worn && (
                                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
                                        <CheckIcon size={14} />
                                    </span>
                                )}
                                <span className={`text-5xl leading-none ${revealed ? "" : "opacity-30 grayscale"}`}>
                                    {revealed ? item.emoji : "❓"}
                                </span>
                                <span className="font-display text-sm font-semibold leading-tight text-ink">
                                    {revealed ? item.name : "???"}
                                </span>
                                {isOutfit ? (
                                    worn ? (
                                        <span className="text-xs font-bold uppercase tracking-wide text-success-dark">Wearing</span>
                                    ) : item.owned ? (
                                        <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Tap to wear</span>
                                    ) : (
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-sm font-semibold ${
                                                canAfford ? "bg-secondary text-[#4a2b00]" : "bg-ink/10 text-ink-muted"
                                            }`}
                                        >
                                            <CoinIcon size={16} />
                                            {item.price}
                                        </span>
                                    )
                                ) : (
                                    <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                                        {item.owned ? "Collected" : "Find it!"}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {tab === "collectible" && (
                    <p className="mt-4 text-sm font-semibold text-ink-muted">
                        Beat zone bosses and open daily chests to find treasures!
                    </p>
                )}
            </div>
        </ModalSheet>
    );
}
