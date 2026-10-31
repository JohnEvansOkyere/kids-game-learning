"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { CoinIcon, LogoMark, StarIcon } from "@/components/ui/Icons";
import { studentsApi } from "@/lib/api";
import type { Student, World } from "@/lib/types";

/** Stars and coins from the copy of the world kept on this device, if the child has played here */
function cachedProgress(studentId: string): { stars: number; coins: number } | null {
    try {
        const raw = localStorage.getItem(`world_${studentId}`);
        if (!raw) return null;
        const world = JSON.parse(raw) as World;
        const stars = world.zones.flatMap((z) => z.nodes).reduce((sum, n) => sum + n.stars, 0);
        return { stars, coins: world.coins };
    } catch {
        return null;
    }
}

export default function StudentSelectPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [progress, setProgress] = useState<Record<string, { stars: number; coins: number }>>({});

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const loadStudents = async () => {
            try {
                const freshStudents = await studentsApi.getAll();
                setStudents(freshStudents);
                localStorage.setItem("students", JSON.stringify(freshStudents));
            } catch {
                const studentsData = localStorage.getItem("students");
                if (studentsData) {
                    setStudents(JSON.parse(studentsData));
                }
            }
        };

        loadStudents();
    }, [router]);

    useEffect(() => {
        const found: Record<string, { stars: number; coins: number }> = {};
        for (const s of students) {
            const p = cachedProgress(s.id);
            if (p) found[s.id] = p;
        }
        setProgress(found);
    }, [students]);

    const handleSelectStudent = (student: Student) => {
        // Store selected student
        localStorage.setItem("selectedStudent", JSON.stringify(student));
        // Straight into the Adventure World map
        router.push("/play");
    };

    const handleAddChild = () => {
        router.push("/student/add");
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-night text-white">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "radial-gradient(640px 360px at 50% -40px, rgb(90 68 242 / 0.55), transparent 70%), radial-gradient(520px 320px at 100% 100%, rgb(255 194 26 / 0.14), transparent 70%)",
                }}
            />

            <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <LogoMark size={34} />
                        <span className="font-display text-lg font-semibold tracking-tight">MathChampions</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/parent/dashboard")}
                        className="min-h-[44px] rounded-full bg-white/10 px-4 font-display text-sm font-semibold text-white/85 transition-colors hover:bg-white/15"
                    >
                        Parent area
                    </button>
                </div>

                <div className="mt-10 text-center">
                    <h1 className="font-display text-4xl font-semibold sm:text-5xl">Who&rsquo;s playing?</h1>
                    <p className="mt-2 text-lg font-semibold text-white/70">Tap your character to jump back in.</p>
                </div>

                <div className="mt-8">
                    <InstallPrompt />
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {students.map((student) => {
                        const p = progress[student.id];
                        return (
                            <button
                                key={student.id}
                                type="button"
                                onClick={() => handleSelectStudent(student)}
                                className="group flex flex-col items-center gap-3 rounded-4xl bg-white/[0.06] p-5 pb-6 ring-1 ring-white/10 transition-all hover:-translate-y-1 hover:bg-white/10 active:scale-95"
                            >
                                <Avatar plate type={student.avatar} size="large" />
                                <span className="max-w-full truncate font-display text-2xl font-semibold">{student.name}</span>
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/75">
                                    {student.gradeLevel}
                                </span>
                                {p && (
                                    <span className="flex items-center gap-3 font-display text-sm font-semibold text-white/85">
                                        <span className="inline-flex items-center gap-1">
                                            <StarIcon size={18} />
                                            {p.stars}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <CoinIcon size={18} />
                                            {p.coins}
                                        </span>
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* Add Child Button (if less than 4 children) */}
                    {students.length < 4 && (
                        <button
                            type="button"
                            onClick={handleAddChild}
                            className="flex min-h-[15rem] flex-col items-center justify-center gap-3 rounded-4xl border-2 border-dashed border-white/25 p-5 text-white/80 transition-colors hover:border-white/50 hover:bg-white/5 active:scale-95"
                        >
                            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 font-display text-5xl font-semibold leading-none">
                                +
                            </span>
                            <span className="font-display text-lg font-semibold">Add a child</span>
                            <span className="text-sm font-semibold text-white/55">{4 - students.length} more allowed</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
