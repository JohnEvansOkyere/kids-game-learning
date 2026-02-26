"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";

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
    const [student, setStudent] = useState<{ name: string } | null>(null);
    const [count, setCount] = useState(0);
    const [stars, setStars] = useState<FallingStar[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [started, setStarted] = useState(false);
    const idRef = useRef(0);
    const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            setStars((prev) => prev.filter((s) => s.id !== id || s.caught));
        }, FALL_DURATION_MS + 500);
    }, []);

    const startGame = useCallback(() => {
        setCount(0);
        setStars([]);
        setGameOver(false);
        setStarted(true);
        spawnStar();
        spawnRef.current = setInterval(spawnStar, STAR_SPAWN_INTERVAL_MS);
    }, [spawnStar]);

    const catchStar = useCallback((id: number) => {
        setStars((prev) =>
            prev.map((s) => (s.id === id ? { ...s, caught: true } : s))
        );
        setCount((c) => {
            const next = c + 1;
            if (next >= GOAL) {
                if (spawnRef.current) clearInterval(spawnRef.current);
                spawnRef.current = null;
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
                        <span className="text-xl font-bold text-primary">
                            ⭐ Caught: {count} / {GOAL}
                        </span>
                    </div>

                    {!started ? (
                        <div className="text-center py-12">
                            <h1 className="text-4xl font-bold text-primary mb-4">
                                🌟 Counting Catch 🌟
                            </h1>
                            <p className="text-xl text-gray-600 mb-6">
                                Catch {GOAL} falling stars, {student.name}! Tap each star to catch it.
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
                                You caught {GOAL} stars!
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
                        <div
                            className="relative rounded-3xl overflow-hidden border-4 border-primary/50 bg-gradient-to-b from-sky-300 to-sky-600 min-h-[420px]"
                            style={{ touchAction: "manipulation" }}
                        >
                            {stars.map(
                                (star) =>
                                    !star.caught && (
                                        <button
                                            key={star.id}
                                            type="button"
                                            className="absolute w-16 h-16 text-4xl cursor-pointer select-none animate-star-fall hover:scale-110 active:scale-95 transition-transform"
                                            style={{
                                                left: `${star.left}%`,
                                                animationDuration: `${FALL_DURATION_MS}ms`,
                                                animationDelay: `${star.delay}s`,
                                                top: "-4rem",
                                            }}
                                            onClick={() => catchStar(star.id)}
                                        >
                                            ⭐
                                        </button>
                                    )
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-700 to-green-500 flex items-end justify-center pb-2">
                                <span className="text-white/80 text-lg font-bold">
                                    Tap the stars!
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
