"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { StarIcon } from "@/components/ui/Icons";
import SkillMap from "@/components/parent/SkillMap";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { practiceApi, skillsApi } from "@/lib/api";
import type { GameSession, Parent, SkillMastery, Student } from "@/lib/types";

/** Normalize session from API (handles camelCase or snake_case) */
function norm(sess: Record<string, unknown>): {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    totalTimeSpent: number;
    starsEarned: number;
    completed: boolean;
    startedAt: string;
    completedAt: string | null;
} {
    return {
        totalQuestions: Number((sess as any).totalQuestions ?? (sess as any).total_questions ?? 0),
        correctAnswers: Number((sess as any).correctAnswers ?? (sess as any).correct_answers ?? 0),
        wrongAnswers: Number((sess as any).wrongAnswers ?? (sess as any).wrong_answers ?? 0),
        totalTimeSpent: Number((sess as any).totalTimeSpent ?? (sess as any).total_time_spent ?? 0),
        starsEarned: Number((sess as any).starsEarned ?? (sess as any).stars_earned ?? 0),
        completed: Boolean((sess as any).completed),
        startedAt: String((sess as any).startedAt ?? (sess as any).started_at ?? ""),
        completedAt: (sess as any).completedAt ?? (sess as any).completed_at ?? null,
    };
}

function formatTotalTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    return min ? `${h}h ${min}m` : `${h}h`;
}

/** "3 days ago" reads better to a parent than a timestamp */
function timeAgo(iso: string): string {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    return new Date(iso).toLocaleDateString();
}

interface StudentSummary {
    student: Student;
    sessions: GameSession[];
    totalStars: number;
    totalScore: number; // total correct answers across all sessions
    averageAccuracy: number;
    bestAccuracy: number;
    totalSessions: number;
    totalTimePracticed: number;
    lastPlayed: string | null;
    mastery: SkillMastery[] | null; // null if it could not be loaded
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="px-4 py-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
            <p className="mt-0.5 font-display text-2xl font-semibold text-ink">{children}</p>
        </div>
    );
}

export default function ParentDashboardPage() {
    const router = useRouter();
    const [parent, setParent] = useState<Parent | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [summaries, setSummaries] = useState<StudentSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const parentRaw = localStorage.getItem("parent");
        const studentsRaw = localStorage.getItem("students");
        if (!parentRaw || !studentsRaw) {
            router.push("/login");
            return;
        }

        setParent(JSON.parse(parentRaw));
        const parsedStudents: Student[] = JSON.parse(studentsRaw);
        setStudents(parsedStudents);

        const loadSessions = async () => {
            try {
                const allSummaries: StudentSummary[] = [];
                for (const s of parsedStudents) {
                    const [rawSessions, mastery] = await Promise.all([
                        practiceApi.getSessions(s.id),
                        skillsApi.getMastery(s.id).catch(() => null),
                    ]);
                    const sessions = rawSessions.map((sess) => norm(sess as unknown as Record<string, unknown>));
                    const totalSessions = sessions.length;
                    const completed = sessions.filter((sess) => sess.completed);

                    const totalStars = completed.reduce((sum, sess) => sum + sess.starsEarned, 0);
                    const totalScore = sessions.reduce((sum, sess) => sum + sess.correctAnswers, 0);
                    const totalTimePracticed = sessions.reduce((sum, sess) => sum + sess.totalTimeSpent, 0);

                    const accuracies = completed.map((sess) => {
                        const total = sess.totalQuestions || sess.correctAnswers + sess.wrongAnswers || 1;
                        return total ? (sess.correctAnswers / total) * 100 : 0;
                    });
                    const averageAccuracy =
                        accuracies.length > 0
                            ? Math.round(
                                  (accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 10
                              ) / 10
                            : 0;
                    const bestAccuracy =
                        accuracies.length > 0 ? Math.round(Math.max(...accuracies) * 10) / 10 : 0;
                    const lastPlayed =
                        completed.length > 0
                            ? completed
                                  .slice()
                                  .sort(
                                      (a, b) =>
                                          new Date(b.completedAt || b.startedAt).getTime() -
                                          new Date(a.completedAt || a.startedAt).getTime()
                                  )[0].completedAt || completed[0].startedAt
                            : null;

                    allSummaries.push({
                        student: s,
                        sessions: rawSessions,
                        totalSessions,
                        totalStars,
                        totalScore,
                        totalTimePracticed,
                        averageAccuracy,
                        bestAccuracy,
                        lastPlayed,
                        mastery,
                    });
                }
                setSummaries(allSummaries);
            } finally {
                setLoading(false);
            }
        };

        loadSessions();
    }, [router]);

    const totalStarsAll = useMemo(
        () => summaries.reduce((sum, s) => sum + s.totalStars, 0),
        [summaries]
    );
    const totalScoreAll = useMemo(
        () => summaries.reduce((sum, s) => sum + s.totalScore, 0),
        [summaries]
    );

    if (!parent) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="font-display text-xl font-semibold text-ink-soft">Loading your dashboard…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                            Parent dashboard
                        </p>
                        <h1 className="font-display text-4xl font-semibold text-ink">Hello, {parent.name}</h1>
                        <p className="mt-1 text-lg font-semibold text-ink-muted">
                            Here&apos;s how your {students.length === 1 ? "child is" : "children are"} getting on.
                        </p>
                    </div>
                    <Button variant="primary" onClick={() => router.push("/student/select")} className="sm:shrink-0">
                        Open the game
                    </Button>
                </div>

                <div className="mt-6">
                    <InstallPrompt />
                </div>

                <div className="card !p-0 grid grid-cols-2 divide-x divide-y divide-ink/10 overflow-hidden md:grid-cols-4 md:divide-y-0">
                    <Stat label="Children">{students.length}</Stat>
                    <Stat label="Correct answers">{totalScoreAll}</Stat>
                    <Stat label="Stars earned">
                        <span className="inline-flex items-center gap-1.5">
                            <StarIcon size={24} />
                            {totalStarsAll}
                        </span>
                    </Stat>
                    <Stat label="Practice sessions">{summaries.reduce((sum, s) => sum + s.totalSessions, 0)}</Stat>
                </div>

                {loading && <p className="mt-6 text-center font-semibold text-ink-muted">Loading practice history…</p>}

                <div className="mt-6 grid grid-cols-1 gap-6">
                    {summaries.map((summary) => (
                        <section key={summary.student.id} className="card !p-5 sm:!p-7">
                            <div className="flex flex-wrap items-center gap-4">
                                <Avatar plate type={summary.student.avatar} size="medium" />
                                <div className="min-w-0 flex-1">
                                    <h2 className="font-display text-2xl font-semibold text-ink">{summary.student.name}</h2>
                                    <p className="font-semibold text-ink-muted">
                                        {summary.student.gradeLevel} ·{" "}
                                        {summary.lastPlayed ? `last played ${timeAgo(summary.lastPlayed)}` : "hasn't played yet"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 divide-x divide-y divide-ink/10 overflow-hidden rounded-2xl ring-1 ring-ink/10 sm:grid-cols-3">
                                <Stat label="Sessions">{summary.totalSessions}</Stat>
                                <Stat label="Correct answers">{summary.totalScore}</Stat>
                                <Stat label="Stars">
                                    <span className="inline-flex items-center gap-1.5">
                                        <StarIcon size={22} />
                                        {summary.totalStars}
                                    </span>
                                </Stat>
                                <Stat label="Average score">{summary.averageAccuracy}%</Stat>
                                <Stat label="Best score">{summary.bestAccuracy}%</Stat>
                                <Stat label="Time practised">{formatTotalTime(summary.totalTimePracticed)}</Stat>
                            </div>

                            {summary.mastery ? (
                                <SkillMap mastery={summary.mastery} gradeLevel={summary.student.gradeLevel} />
                            ) : (
                                <p className="mt-5 font-semibold text-ink-muted">Skill progress isn&apos;t available right now.</p>
                            )}
                        </section>
                    ))}
                </div>

                <div className="mt-10 flex justify-center">
                    <Button
                        variant="neutral"
                        onClick={() => {
                            localStorage.removeItem("token");
                            router.push("/login");
                        }}
                    >
                        Log out
                    </Button>
                </div>
            </div>
        </div>
    );
}
