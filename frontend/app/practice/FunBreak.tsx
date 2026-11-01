"use client";

/**
 * FunBreak - a short no-maths tapping game between questions
 *
 * Kids tap the floating things until they're all gone (or time runs out),
 * then the river game carries on. DOM + CSS only so it stays light on cheap phones.
 */
import React, { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { playPopSFX, playVictorySFX } from "./GameAudio";

const THEMES = [
    { emoji: "🐟", title: "Catch the fish!" },
    { emoji: "🦋", title: "Catch the butterflies!" },
    { emoji: "🎈", title: "Pop the balloons!" },
    { emoji: "🥭", title: "Pick the mangoes!" },
];
const TARGETS = 6;
const MAX_BREAK_MS = 12000;

type Target = { id: number; left: number; top: number; delay: number; popped: boolean };

function makeTargets(): Target[] {
    return Array.from({ length: TARGETS }, (_, id) => ({
        id,
        // Spread across a 3x2 grid with some jitter so targets don't overlap
        left: (id % 3) * 30 + 8 + Math.random() * 12,
        top: Math.floor(id / 3) * 45 + 8 + Math.random() * 20,
        delay: Math.random() * 600,
        popped: false,
    }));
}

export type FunBreakResult = "all" | "skip" | "timeout";

export default function FunBreak({ onDone }: { onDone: (result: FunBreakResult, caught: number) => void }) {
    const [theme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)]);
    const [targets, setTargets] = useState(makeTargets);
    const doneRef = useRef(false);
    const poppedCount = targets.filter((t) => t.popped).length;
    // Read by the timeout, which only sees the first render
    const poppedRef = useRef(0);
    poppedRef.current = poppedCount;

    const finish = (result: FunBreakResult) => {
        if (doneRef.current) return;
        doneRef.current = true;
        onDone(result, poppedRef.current);
    };

    // Never hold the child up for long
    useEffect(() => {
        const timer = setTimeout(() => finish("timeout"), MAX_BREAK_MS);
        return () => clearTimeout(timer);
        // finish is stable in effect via doneRef
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (poppedCount < TARGETS) return;
        playVictorySFX();
        const timer = setTimeout(() => finish("all"), 1000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poppedCount]);

    const pop = (id: number) => {
        playPopSFX(poppedCount);
        setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, popped: true } : t)));
    };

    return (
        <div className="bg-white rounded-3xl border-4 border-secondary shadow-lg p-4 text-center animate-bounce-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">🎉 Fun Break! {theme.title}</h2>
            <p className="text-lg font-bold text-gray-700 mb-2">
                {poppedCount < TARGETS ? `${poppedCount} / ${TARGETS}` : "Ayekoo! Back to the river! 🌊"}
            </p>

            <div className="relative h-56 sm:h-64 rounded-2xl bg-gradient-to-b from-sky-100 to-cyan-200 overflow-hidden">
                {targets.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        disabled={t.popped}
                        onClick={() => pop(t.id)}
                        aria-label={t.popped ? "Caught" : `Tap ${theme.emoji}`}
                        className={`absolute min-h-touch min-w-touch text-5xl transition duration-300 ${
                            t.popped ? "scale-150 opacity-0" : ""
                        }`}
                        style={{ left: `${t.left}%`, top: `${t.top}%` }}
                    >
                        <span
                            className={`inline-block ${t.popped ? "" : "animate-bounce"}`}
                            style={{ animationDelay: `${t.delay}ms` }}
                        >
                            {t.popped ? "✨" : theme.emoji}
                        </span>
                    </button>
                ))}
            </div>

            <Button variant="secondary" className="mt-3" onClick={() => finish("skip")}>
                Keep going ▶️
            </Button>
        </div>
    );
}
