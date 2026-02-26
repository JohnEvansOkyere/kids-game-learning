"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";

const MAX_NUMBER = 10;

export default function NumberPopPage() {
    const router = useRouter();
    const [student, setStudent] = useState<{ name: string } | null>(null);
    const [nextToPop, setNextToPop] = useState(1);
    const [wrongTapped, setWrongTapped] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [started, setStarted] = useState(false);
    const [gameKey, setGameKey] = useState(0);

    useEffect(() => {
        const raw = localStorage.getItem("selectedStudent");
        if (!raw) {
            router.push("/student/select");
            return;
        }
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
                setTimeout(() => setWrongTapped(null), 600);
            }
        },
        [nextToPop]
    );

    const startGame = useCallback(() => {
        setNextToPop(1);
        setWrongTapped(null);
        setGameOver(false);
        setStarted(true);
        setGameKey((k) => k + 1);
    }, []);

    if (!student) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-2xl text-gray-600">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-6">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="text-primary font-bold hover:underline"
                        >
                            ← Back
                        </button>
                        {started && !gameOver && (
                            <span className="text-xl font-bold text-primary">
                                Tap: {nextToPop} →
                            </span>
                        )}
                    </div>

                    {!started ? (
                        <div className="text-center py-12">
                            <h1 className="text-4xl font-bold text-primary mb-4">
                                🔢 Number Pop 🔢
                            </h1>
                            <p className="text-xl text-gray-600 mb-6">
                                Tap the numbers in order from 1 to {MAX_NUMBER},{" "}
                                {student.name}!
                            </p>
                            <Button variant="primary" onClick={startGame}>
                                Start Game
                            </Button>
                        </div>
                    ) : gameOver ? (
                        <div className="text-center py-12">
                            <h2 className="text-4xl font-bold text-primary mb-4">
                                Ayekoo! 🎉
                            </h2>
                            <p className="text-2xl text-gray-700 mb-6">
                                You popped 1 to {MAX_NUMBER} in order!
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button variant="primary" onClick={startGame}>
                                    Play Again
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => router.push("/dashboard")}
                                >
                                    Dashboard
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {wrongTapped !== null && (
                                <p className="text-center text-danger font-bold text-lg mb-2 animate-shake">
                                    Tap {nextToPop} next, not {wrongTapped}! 👆
                                </p>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {shuffled.map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => handlePop(n)}
                                        className={`
                                            min-h-[80px] rounded-2xl border-4 text-3xl font-bold
                                            transition-all duration-200 hover:scale-105 active:scale-95
                                            ${
                                                n < nextToPop
                                                    ? "bg-gray-300 border-gray-400 text-gray-500 cursor-default"
                                                    : n === nextToPop
                                                    ? "bg-primary border-primary-dark text-white shadow-lg"
                                                    : "bg-white border-primary text-primary hover:border-primary-dark"
                                            }
                                            ${wrongTapped === n ? "animate-shake border-danger bg-danger/20" : ""}
                                        `}
                                        disabled={n < nextToPop}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
