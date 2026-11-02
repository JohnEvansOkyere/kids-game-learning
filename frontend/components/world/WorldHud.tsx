"use client";

/**
 * WorldHud, Dock and GoalCard - the chrome around the Adventure map
 *
 * HUD (top): who is playing, stars, coins.
 * Dock (bottom, thumb zone): map, daily chest, shop, free play.
 * GoalCard: the one next thing worth doing, worked out from the child's real data.
 */
import React from "react";
import Avatar from "@/components/ui/Avatar";
import { BagIcon, CoinIcon, GamepadIcon, GiftIcon, MapIcon, StarIcon } from "@/components/ui/Icons";
import type { Student, World, WorldItem, WorldNode } from "@/lib/types";

function Pill({ icon, value, popKey }: { icon: React.ReactNode; value: number; popKey?: number }) {
    return (
        <span
            key={popKey}
            className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary pl-2 pr-3 font-display text-base font-semibold text-white ${
                popKey !== undefined ? "animate-pop" : ""
            }`}
        >
            {icon}
            {value}
        </span>
    );
}

export function WorldHud({
    student,
    world,
    totalStars,
    onSwitchPlayer,
}: {
    student: Student;
    world: World | null;
    totalStars: number;
    onSwitchPlayer: () => void;
}) {
    return (
        <div className="sticky top-0 z-30 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <div className="mx-auto flex max-w-[480px] items-center gap-2 rounded-[1.75rem] bg-white p-1.5 pr-2 shadow-card ring-2 ring-primary">
                <button
                    type="button"
                    onClick={onSwitchPlayer}
                    aria-label="Switch player"
                    className="flex min-w-0 items-center gap-2 rounded-full pr-2 text-left"
                >
                    <Avatar plate type={student.avatar} size="small" outfit={world?.equippedItem?.emoji} />
                    <span className="min-w-0 leading-tight">
                        <span className="block max-w-[7rem] truncate font-display text-base font-semibold text-ink">
                            {student.name}
                        </span>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                            {student.gradeLevel}
                        </span>
                    </span>
                </button>

                <div className="flex-1" />

                <Pill icon={<StarIcon size={22} />} value={totalStars} />
                <Pill icon={<CoinIcon size={22} />} value={world?.coins ?? 0} popKey={world?.coins ?? 0} />
            </div>
        </div>
    );
}

function DockButton({
    icon,
    label,
    onClick,
    active = false,
    disabled = false,
    badge = false,
    wiggle = false,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    badge?: boolean;
    wiggle?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-[3.75rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] font-display text-[11px] font-semibold transition-colors disabled:opacity-45 ${
                active ? "bg-primary text-white" : "text-primary active:bg-primary/10"
            }`}
        >
            <span className={wiggle ? "animate-wiggle" : ""}>{icon}</span>
            {label}
            {badge && (
                <span
                    aria-hidden
                    className="absolute right-[27%] top-1.5 h-3 w-3 animate-pulse rounded-full bg-secondary ring-2 ring-white"
                />
            )}
        </button>
    );
}

export function Dock({
    chestAvailable,
    busy,
    onMap,
    onChest,
    onShop,
    onGames,
}: {
    chestAvailable: boolean;
    busy: boolean;
    onMap: () => void;
    onChest: () => void;
    onShop: () => void;
    onGames: () => void;
}) {
    return (
        <nav
            aria-label="Adventure menu"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
            <div className="pointer-events-auto flex w-full max-w-[420px] items-stretch gap-1 rounded-[1.75rem] bg-white p-1.5 shadow-card ring-2 ring-primary">
                <DockButton icon={<MapIcon size={26} />} label="Map" active onClick={onMap} />
                <DockButton
                    icon={<GiftIcon size={26} />}
                    label={chestAvailable ? "Chest" : "Tomorrow"}
                    onClick={onChest}
                    disabled={!chestAvailable || busy}
                    badge={chestAvailable}
                    wiggle={chestAvailable}
                />
                <DockButton icon={<BagIcon size={26} />} label="Shop" onClick={onShop} />
                <DockButton icon={<GamepadIcon size={26} />} label="Games" onClick={onGames} />
            </div>
        </nav>
    );
}

type Goal = {
    emoji: string;
    title: string;
    detail: string;
    progress?: number; // 0-100
    cta?: { label: string; onClick: () => void };
};

/** One clear next thing, in priority order: chest, an outfit they can afford, an outfit they're saving for, the next stage */
function pickGoal(
    world: World,
    currentNode: WorldNode | null,
    actions: { openChest: () => void; openShop: () => void; playNode: (n: WorldNode) => void }
): Goal | null {
    if (world.chestAvailable) {
        return {
            emoji: "🎁",
            title: "Your daily chest is ready!",
            detail: "Tap to see what's inside.",
            cta: { label: "Open", onClick: actions.openChest },
        };
    }

    const wanted = world.items
        .filter((i: WorldItem) => i.kind === "outfit" && !i.owned && i.price !== null)
        .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];

    if (wanted && wanted.price !== null) {
        if (world.coins >= wanted.price) {
            return {
                emoji: wanted.emoji,
                title: `You can get the ${wanted.name}!`,
                detail: `${wanted.price} coins · you have ${world.coins}`,
                cta: { label: "Shop", onClick: actions.openShop },
            };
        }
        return {
            emoji: wanted.emoji,
            title: `Saving for the ${wanted.name}`,
            detail: `${wanted.price - world.coins} more coins to go`,
            progress: Math.round((world.coins / wanted.price) * 100),
        };
    }

    if (currentNode) {
        return {
            emoji: currentNode.emoji,
            title: `Next up: ${currentNode.title}`,
            detail: "Your adventure is waiting.",
            cta: { label: "Play", onClick: () => actions.playNode(currentNode) },
        };
    }

    return null;
}

export function GoalCard({
    world,
    currentNode,
    openChest,
    openShop,
    playNode,
}: {
    world: World;
    currentNode: WorldNode | null;
    openChest: () => void;
    openShop: () => void;
    playNode: (n: WorldNode) => void;
}) {
    const goal = pickGoal(world, currentNode, { openChest, openShop, playNode });
    if (!goal) return null;

    return (
        <div className="mx-auto max-w-[480px] px-3">
            <div className="flex items-center gap-3 rounded-3xl bg-white p-3 pr-3.5 shadow-card ring-2 ring-white">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl">
                    {goal.emoji}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-semibold leading-tight text-ink">{goal.title}</p>
                    <p className="text-sm font-semibold text-ink-muted">{goal.detail}</p>
                    {goal.progress !== undefined && (
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-primary/15">
                            <div
                                className="h-full rounded-full bg-secondary"
                                style={{ width: `${Math.min(100, goal.progress)}%` }}
                            />
                        </div>
                    )}
                </div>
                {goal.cta && (
                    <button type="button" onClick={goal.cta.onClick} className="btn-secondary !min-h-[48px] !px-5 !py-2 !text-base">
                        {goal.cta.label}
                    </button>
                )}
            </div>
        </div>
    );
}
