"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { GameDone, GameIntro, GameTopBar, HudChip } from "@/components/games/GameScreen";
import { StarIcon } from "@/components/ui/Icons";
import NodeResult from "@/components/world/NodeResult";
import { getNodeIdFromUrl } from "@/lib/world";

const GOAL = 10;
const STAR_SPAWN_INTERVAL_MS = 1200;
const FALL_DURATION_MS = 4000;

interface FallingStar {
    id: number;
    left: number; // percent
    delay: number;
    caught: boolean;
}

export default function CountingCatchPage() {
    const router = useRouter();
    const [student, setStudent] = useState<{ id: string; name: string } | null>(null);
    const [count, setCount] = useState(0);
    const [stars, setStars] = useState<FallingStar[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [started, setStarted] = useState(false);
    const [missed, setMissed] = useState(0);
    const [round, setRound] = useState(0);
    // Set when launched from the Adventure World map (?node=...)
    const [nodeId, setNodeId] = useState<string | null>(null);
    const idRef = useRef(0);
    const caughtRef = useRef<Set<number>>(new Set());
    const gameOverRef = useRef(false);
    const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem("selectedStudent");
        if (!raw) {
            router.push("/student/select");
            return;
        }
        setNodeId(getNodeIdFromUrl());
        try {
            const s = JSON.parse(raw);
            setStudent(s);
        } catch {
            router.push("/student/select");
        }
    }, [router]);

    const spawnStar = useCallback(() => {
        idRef.current += 1;
        const id = idRef.current;
        setStars((prev) => [
            ...prev,
            {
                id,
                left: 10 + Math.random() * 80,
                delay: Math.random() * 0.5,
                caught: false,
            },
        ]);
        // Remove after fall animation so we don't pile up
        setTimeout(() => {
            // A star that reached the ground uncaught counts as a miss
            if (!caughtRef.current.has(id) && !gameOverRef.current) {
                setMissed((m) => m + 1);
            }
            setStars((prev) => prev.filter((s) => s.id !== id || s.caught));
        }, FALL_DURATION_MS + 500);
    }, []);

    const startGame = useCallback(() => {
        setCount(0);
        setStars([]);
        setMissed(0);
        caughtRef.current = new Set();
        gameOverRef.current = false;
        setGameOver(false);
        setStarted(true);
        setRound((r) => r + 1);
        spawnStar();
        spawnRef.current = setInterval(spawnStar, STAR_SPAWN_INTERVAL_MS);
    }, [spawnStar]);

    const catchStar = useCallback((id: number) => {
        caughtRef.current.add(id);
        setStars((prev) =>
            prev.map((s) => (s.id === id ? { ...s, caught: true } : s))
        );
        setCount((c) => {
            const next = c + 1;
            if (next >= GOAL) {
                if (spawnRef.current) clearInterval(spawnRef.current);
                spawnRef.current = null;
                gameOverRef.current = true;
                setGameOver(true);
            }
            return next;
        });
    }, []);

    useEffect(() => {
        return () => {
            if (spawnRef.current) clearInterval(spawnRef.current);
        };
    }, []);

    if (!student) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="font-display text-2xl font-semibold text-ink-muted">Loading...</p>
            </div>
        );
    }

    const goBack = () => router.push(nodeId ? "/play" : "/dashboard");
    const playing = started && !gameOver;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-6">
                <div className="max-w-2xl mx-auto">
                    <GameTopBar onBack={goBack}>
                        {playing && (
                            <div className="flex flex-1 items-center gap-3">
                                <div
                                    className="h-5 flex-1 overflow-hidden rounded-full bg-ink/10 ring-1 ring-ink/5"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={GOAL}
                                    aria-valuenow={Math.min(count, GOAL)}
                                >
                                    <div
                                        className="relative h-full rounded-full bg-gradient-to-b from-secondary-light to-secondary transition-all duration-300"
                                        style={{ width: `${(Math.min(count, GOAL) / GOAL) * 100}%` }}
                                    >
                                        <span className="absolute inset-x-2 top-[3px] h-1 rounded-full bg-white/50" />
                                    </div>
                                </div>
                                <HudChip>
                                    <StarIcon size={22} />
                                    {count}/{GOAL}
                                </HudChip>
                            </div>
                        )}
                    </GameTopBar>

                    {!started ? (
                        <GameIntro emoji="🌟" title="Counting Catch" onStart={startGame} startLabel="Start">
                            Catch {GOAL} falling stars, {student.name}! Tap each star to catch it.
                        </GameIntro>
                    ) : gameOver ? (
                        <GameDone
                            title="Ayekoo! 🎉"
                            subtitle={`You caught ${GOAL} stars!`}
                            onPlayAgain={startGame}
                            onExit={() => router.push("/dashboard")}
                        >
                            {nodeId ? (
                                <NodeResult
                                    key={round}
                                    studentId={student.id}
                                    nodeId={nodeId}
                                    correct={GOAL}
                                    total={GOAL + missed}
                                    onPlayAgain={startGame}
                                />
                            ) : undefined}
                        </GameDone>
                    ) : (
                        <div
                            className="relative h-[440px] overflow-hidden rounded-4xl bg-[#76c7dc] shadow-card ring-4 ring-white"
                            style={{ touchAction: "manipulation", backgroundImage: "linear-gradient(180deg,rgba(32,86,122,.14),rgba(22,72,55,.3)),url('/zones/farm.webp')", backgroundPosition: "center", backgroundSize: "cover" }}
                        >
                            {/* Drifting clouds */}
                            <div aria-hidden className="pointer-events-none absolute inset-0">
                                <div className="animate-drift absolute left-[8%] top-[12%] h-8 w-28 rounded-full bg-white/70 blur-[1px]" />
                                <div
                                    className="animate-drift absolute right-[10%] top-[28%] h-7 w-24 rounded-full bg-white/60 blur-[1px]"
                                    style={{ animationDelay: "-6s" }}
                                />
                            </div>

                            {stars.map(
                                (star) =>
                                    !star.caught && (
                                        <button
                                            key={star.id}
                                            type="button"
                                            aria-label="Catch the star"
                                            className="absolute flex h-16 w-16 cursor-pointer select-none items-center justify-center animate-star-fall"
                                            style={{
                                                left: `${star.left}%`,
                                                animationDuration: `${FALL_DURATION_MS}ms`,
                                                animationDelay: `${star.delay}s`,
                                                top: "-4rem",
                                            }}
                                            onClick={() => catchStar(star.id)}
                                        >
                                            <span className="pointer-events-none drop-shadow-[0_0_10px_rgba(255,226,122,0.95)]">
                                                <StarIcon size={58} />
                                            </span>
                                        </button>
                                    )
                            )}

                            {/* Rolling hills */}
                            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28">
                                <div className="absolute -left-[10%] bottom-0 h-24 w-[70%] rounded-t-[100%] bg-gradient-to-b from-success to-success-dark opacity-80" />
                                <div className="absolute -right-[10%] bottom-0 h-20 w-[75%] rounded-t-[100%] bg-gradient-to-b from-success-light to-success" />
                            </div>
                            <p className="absolute inset-x-0 bottom-3 text-center font-display text-lg font-semibold text-white drop-shadow">
                                Tap the stars!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
