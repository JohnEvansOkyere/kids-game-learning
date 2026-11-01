"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { GameDone, GameIntro, GameTopBar, HudChip } from "@/components/games/GameScreen";
import { CheckIcon } from "@/components/ui/Icons";
import NodeResult from "@/components/world/NodeResult";
import { getNodeIdFromUrl } from "@/lib/world";

const MAX_NUMBER = 10;

export default function NumberPopPage() {
    const router = useRouter();
    const [student, setStudent] = useState<{ id: string; name: string } | null>(null);
    const [nextToPop, setNextToPop] = useState(1);
    const [wrongTapped, setWrongTapped] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [started, setStarted] = useState(false);
    const [gameKey, setGameKey] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    // Set when launched from the Adventure World map (?node=...)
    const [nodeId, setNodeId] = useState<string | null>(null);

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

    const shuffled = React.useMemo(
        () =>
            Array.from({ length: MAX_NUMBER }, (_, i) => i + 1).sort(
                () => Math.random() - 0.5
            ),
        [gameKey]
    );

    const handlePop = useCallback(
        (n: number) => {
            if (n === nextToPop) {
                if (n === MAX_NUMBER) {
                    setGameOver(true);
                } else {
                    setNextToPop((prev) => prev + 1);
                }
                setWrongTapped(null);
            } else {
                setWrongTapped(n);
                setMistakes((m) => m + 1);
                setTimeout(() => setWrongTapped(null), 600);
            }
        },
        [nextToPop]
    );

    const startGame = useCallback(() => {
        setNextToPop(1);
        setWrongTapped(null);
        setMistakes(0);
        setGameOver(false);
        setStarted(true);
        setGameKey((k) => k + 1);
    }, []);

    if (!student) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="font-display text-2xl font-semibold text-ink-muted">Loading...</p>
            </div>
        );
    }

    const playing = started && !gameOver;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-6">
                <div className="max-w-2xl mx-auto">
                    <GameTopBar onBack={() => router.push(nodeId ? "/play" : "/dashboard")}>
                        {playing && (
                            <div className="flex flex-1 items-center gap-3">
                                <div
                                    className="h-5 flex-1 overflow-hidden rounded-full bg-ink/10 ring-1 ring-ink/5"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={MAX_NUMBER}
                                    aria-valuenow={nextToPop - 1}
                                >
                                    <div
                                        className="relative h-full rounded-full bg-gradient-to-b from-success-light to-success transition-all duration-300"
                                        style={{ width: `${((nextToPop - 1) / MAX_NUMBER) * 100}%` }}
                                    >
                                        <span className="absolute inset-x-2 top-[3px] h-1 rounded-full bg-white/40" />
                                    </div>
                                </div>
                                <HudChip>Tap {nextToPop} →</HudChip>
                            </div>
                        )}
                    </GameTopBar>

                    {!started ? (
                        <GameIntro emoji="🔢" title="Number Pop" onStart={startGame} startLabel="Start">
                            Tap the numbers in order from 1 to {MAX_NUMBER}, {student.name}!
                        </GameIntro>
                    ) : gameOver ? (
                        <GameDone
                            title="Ayekoo! 🎉"
                            subtitle={`You popped 1 to ${MAX_NUMBER} in order!`}
                            onPlayAgain={startGame}
                            onExit={() => router.push("/dashboard")}
                        >
                            {nodeId ? (
                                <NodeResult
                                    key={gameKey}
                                    studentId={student.id}
                                    nodeId={nodeId}
                                    correct={MAX_NUMBER}
                                    total={MAX_NUMBER + mistakes}
                                    onPlayAgain={startGame}
                                />
                            ) : undefined}
                        </GameDone>
                    ) : (
                        <>
                            {/* Reserved height so the grid doesn't jump when the hint appears */}
                            <div className="mb-3 flex min-h-[3rem] items-center justify-center">
                                {wrongTapped !== null && (
                                    <p className="animate-shake rounded-full bg-danger/10 px-4 py-2 font-display text-lg font-semibold text-danger-dark">
                                        Tap {nextToPop} next, not {wrongTapped}! 👆
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 rounded-4xl bg-[#e7bc7e] p-4 shadow-card sm:grid-cols-3" style={{ backgroundImage: "linear-gradient(180deg,rgba(255,246,226,.36),rgba(255,246,226,.7)),url('/zones/village.webp')", backgroundPosition: "center", backgroundSize: "cover" }}>
                                {shuffled.map((n) => {
                                    const done = n < nextToPop;
                                    const isNext = n === nextToPop;
                                    const isWrong = wrongTapped === n;
                                    return (
                                        <Button
                                            key={n}
                                            variant={isWrong ? "danger" : done ? "success" : isNext ? "primary" : "neutral"}
                                            onClick={() => handlePop(n)}
                                            disabled={done}
                                            aria-label={done ? `${n}, done` : String(n)}
                                            // Popped keys fade to pale green, so their digits go dark green to stay readable
                                            className={`!min-h-[88px] !text-4xl ${done ? "!text-success-dark" : ""} ${isWrong ? "animate-shake !opacity-100 ![filter:none]" : ""}`}
                                        >
                                            {n}
                                            {done && <CheckIcon size={24} />}
                                        </Button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
