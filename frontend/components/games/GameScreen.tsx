"use client";

/**
 * GameScreen - the shared pieces of the small games (Counting Catch, Number Pop)
 * and the Tug of War menus: a top bar, an intro card and a "you did it" card.
 *
 * Keeping them in one place means every game starts and ends the same way, so a
 * child always knows where "start", "again" and "back to the map" are.
 */
import React from "react";
import Button from "@/components/ui/Button";
import { ChevronLeftIcon } from "@/components/ui/Icons";
import RewardBurst from "@/components/world/RewardBurst";

/** Round back button on the left, a live chip (score, "tap 4 next") on the right */
export function GameTopBar({
    onBack,
    children,
    dark = false,
}: {
    onBack: () => void;
    children?: React.ReactNode;
    dark?: boolean;
}) {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <button
                type="button"
                aria-label="Back"
                onClick={onBack}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lift ring-1 active:scale-95 ${
                    dark ? "bg-white text-primary ring-white" : "bg-white text-ink-soft ring-primary/20"
                }`}
            >
                <ChevronLeftIcon size={24} />
            </button>
            {children}
        </div>
    );
}

/** A pill for live numbers in the top bar */
export function HudChip({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-display text-lg font-semibold text-ink shadow-lift ring-1 ring-ink/5">
            {children}
        </span>
    );
}

/** Big friendly start card: a picture, the game's name, one line on how to play */
export function GameIntro({
    emoji,
    title,
    children,
    onStart,
    startLabel = "Start",
    disabled = false,
}: {
    emoji: string;
    title: string;
    children: React.ReactNode;
    onStart: () => void;
    startLabel?: string;
    disabled?: boolean;
}) {
    return (
        <div className="card relative isolate mx-auto max-w-md overflow-hidden text-center !p-7 sm:!p-9">
            <div
                aria-hidden
                className="absolute inset-x-0 top-0 -z-10 h-40 bg-transparent"
            />
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-secondary/25 text-6xl ring-4 ring-white">
                <span className="animate-float">{emoji}</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
            <p className="mb-6 mt-2 text-lg text-ink-soft">{children}</p>
            <Button variant="success" fullWidth onClick={onStart} disabled={disabled}>
                {startLabel}
            </Button>
        </div>
    );
}

/**
 * The end-of-game card. On the map, pass `children` (the NodeResult); in free
 * play it shows Play again / Free play instead.
 */
export function GameDone({
    title,
    subtitle,
    children,
    onPlayAgain,
    onExit,
    exitLabel = "Free play",
}: {
    title: string;
    subtitle: string;
    children?: React.ReactNode;
    onPlayAgain: () => void;
    onExit: () => void;
    exitLabel?: string;
}) {
    return (
        <div className="card relative isolate mx-auto max-w-md overflow-hidden text-center !p-7 sm:!p-9">
            <RewardBurst className="-z-10" />
            <h2 className="font-display text-4xl font-semibold text-ink">{title}</h2>
            <p className="mb-6 mt-1 text-lg font-semibold text-ink-soft">{subtitle}</p>
            {children ?? (
                <div className="mx-auto flex max-w-sm flex-col gap-3">
                    <Button variant="success" fullWidth onClick={onPlayAgain}>
                        Play again
                    </Button>
                    <Button variant="neutral" fullWidth onClick={onExit}>
                        {exitLabel}
                    </Button>
                </div>
            )}
        </div>
    );
}
