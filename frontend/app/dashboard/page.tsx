"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeftIcon } from "@/components/ui/Icons";
import type { Student } from "@/lib/types";

type Tile = {
    href?: string;
    emoji: string;
    title: string;
    blurb: string;
    from: string;
    to: string;
    ledge: string;
    ink: string; // text colour that passes contrast on this tile
};

const GAMES: Tile[] = [
    {
        href: "/games/market-day",
        emoji: "🛒",
        title: "Market Day",
        blurb: "Run a stall and give each customer the right change.",
        from: "#329b70",
        to: "#177452",
        ledge: "#0c5039",
        ink: "#ffffff",
    },
    {
        href: "/practice",
        emoji: "🌊",
        title: "River Crossing",
        blurb: "Answer to step on the stones. Watch out for the crocodile!",
        from: "#5CCBFF",
        to: "#1E9BEA",
        ledge: "#0F6FB5",
        ink: "#ffffff",
    },
    {
        href: "/battle",
        emoji: "⚔️",
        title: "Tug of War",
        blurb: "Two players, one question. First right answer pulls the rope!",
        from: "#FF8A7A",
        to: "#FF4D3D",
        ledge: "#A82217",
        ink: "#ffffff",
    },
    {
        href: "/games/counting-catch",
        emoji: "🌟",
        title: "Counting Catch",
        blurb: "Catch the falling stars. Can you get 10?",
        from: "#FFE27A",
        to: "#FFC21A",
        ledge: "#C98600",
        ink: "#4a2b00",
    },
    {
        href: "/games/number-pop",
        emoji: "🔢",
        title: "Number Pop",
        blurb: "Pop the numbers in order, 1 to 10!",
        from: "#B49CFF",
        to: "#7A5CF5",
        ledge: "#4B34C4",
        ink: "#ffffff",
    },
];

const SOON: { emoji: string; title: string }[] = [
    { emoji: "🏆", title: "Trophies" },
    { emoji: "📊", title: "My Progress" },
];

export default function DashboardPage() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);

    useEffect(() => {
        // Load selected student
        const studentData = localStorage.getItem("selectedStudent");
        if (studentData) {
            setStudent(JSON.parse(studentData));
        } else {
            router.push("/student/select");
        }
    }, [router]);

    if (!student) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="font-display text-xl font-semibold text-ink-soft">Loading…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-16">
            <div className="mx-auto max-w-3xl px-5 pt-5">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.push("/play")}
                        className="inline-flex min-h-[48px] items-center gap-1 rounded-full bg-white py-2 pl-3 pr-4 font-display text-base font-semibold text-ink shadow-lift ring-1 ring-ink/5"
                    >
                        <ChevronLeftIcon size={22} />
                        Map
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/student/select")}
                        className="min-h-[48px] rounded-full px-4 font-display text-sm font-semibold text-ink-muted hover:text-ink"
                    >
                        Switch player
                    </button>
                </div>

                <div className="mt-6">
                    <h1 className="font-display text-4xl font-semibold text-ink">Free play</h1>
                    <p className="mt-1 text-lg font-semibold text-ink-muted">
                        Pick any game, {student.name}. Practise as much as you like.
                    </p>
                </div>

                {/* Back to the adventure */}
                <button
                    type="button"
                    onClick={() => router.push("/play")}
                    className="node-btn mt-6 flex w-full items-center gap-4 rounded-4xl p-5 text-left text-white"
                    style={
                        {
                            backgroundImage: "linear-gradient(135deg,#7A5CF5,#3F2BD0)",
                            "--ledge": "#2A1A9E",
                        } as React.CSSProperties
                    }
                >
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl">🗺️</span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-display text-2xl font-semibold">Adventure Map</span>
                        <span className="block font-semibold text-white/80">Beat bosses, collect treasures, earn coins.</span>
                    </span>
                </button>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {GAMES.map((game) => (
                        <button
                            key={game.title}
                            type="button"
                            onClick={() => game.href && router.push(game.href)}
                            className="node-btn flex flex-col items-start gap-3 rounded-4xl p-5 text-left"
                            style={
                                {
                                    backgroundImage: `linear-gradient(160deg, ${game.from}, ${game.to})`,
                                    color: game.ink,
                                    "--ledge": game.ledge,
                                } as React.CSSProperties
                            }
                        >
                            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/35 text-4xl">{game.title === "Market Day" ? <Image src="/market/shopkeeper.webp" alt="" width={320} height={480} unoptimized className="h-20 w-auto object-contain object-top" /> : game.emoji}</span>
                            <span>
                                <span className="block font-display text-2xl font-semibold">{game.title}</span>
                                <span className="mt-0.5 block font-semibold opacity-85">{game.blurb}</span>
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                    {SOON.map((item) => (
                        <div
                            key={item.title}
                            aria-disabled
                            className="flex items-center gap-3 rounded-3xl bg-ink/5 p-4 text-ink-muted"
                        >
                            <span className="text-3xl opacity-60 grayscale">{item.emoji}</span>
                            <span className="min-w-0">
                                <span className="block font-display text-base font-semibold">{item.title}</span>
                                <span className="block text-xs font-bold uppercase tracking-wider">Coming soon</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
