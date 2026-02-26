"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { practiceApi } from "@/lib/api";
import type { GameSession, Parent, Student } from "@/lib/types";

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
                    const rawSessions = await practiceApi.getSessions(s.id);
                    const sessions = rawSessions.map((sess) => norm(sess as Record<string, unknown>));
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-2xl text-gray-600">Loading parent dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-primary mb-2">
                            Welcome, {parent.name}! 👋
                        </h2>
                        <p className="text-xl text-gray-600">
                            Here&apos;s how your children are doing in MathChampions Ghana.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Card colorful className="text-center p-4">
                            <p className="text-sm text-gray-500">Children</p>
                            <p className="text-3xl font-bold text-primary">{students.length}</p>
                        </Card>
                        <Card colorful className="text-center p-4">
                            <p className="text-sm text-gray-500">Total Score</p>
                            <p className="text-3xl font-bold text-green-600">
                                ✅ {totalScoreAll}
                            </p>
                        </Card>
                        <Card colorful className="text-center p-4">
                            <p className="text-sm text-gray-500">Total Stars Earned</p>
                            <p className="text-3xl font-bold text-yellow-400">
                                ⭐ {totalStarsAll}
                            </p>
                        </Card>
                        <Card colorful className="text-center p-4">
                            <p className="text-sm text-gray-500">Total Practice Sessions</p>
                            <p className="text-3xl font-bold text-primary">
                                {summaries.reduce((sum, s) => sum + s.totalSessions, 0)}
                            </p>
                        </Card>
                    </div>

                    {loading && (
                        <div className="text-center text-gray-600 mb-4">
                            Loading practice history...
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {summaries.map((summary) => (
                            <Card key={summary.student.id} colorful className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar type={summary.student.avatar} size="medium" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-primary">
                                            {summary.student.name}
                                        </h3>
                                        <p className="text-gray-600">
                                            Grade: {summary.student.gradeLevel}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1 text-gray-700">
                                    <p>
                                        📚 Sessions played:{" "}
                                        <span className="font-bold">
                                            {summary.totalSessions}
                                        </span>
                                    </p>
                                    <p>
                                        ✅ Total score (correct answers):{" "}
                                        <span className="font-bold">
                                            {summary.totalScore}
                                        </span>
                                    </p>
                                    <p>
                                        ⭐ Total stars:{" "}
                                        <span className="font-bold text-yellow-400">
                                            {summary.totalStars}
                                        </span>
                                    </p>
                                    <p>
                                        📈 Average score:{" "}
                                        <span className="font-bold">
                                            {summary.averageAccuracy}%
                                        </span>
                                    </p>
                                    <p>
                                        🏅 Best score:{" "}
                                        <span className="font-bold">
                                            {summary.bestAccuracy}%
                                        </span>
                                    </p>
                                    <p>
                                        ⏱️ Total time practiced:{" "}
                                        <span className="font-bold">
                                            {formatTotalTime(summary.totalTimePracticed)}
                                        </span>
                                    </p>
                                    <p>
                                        🗓️ Last played:{" "}
                                        <span className="font-bold">
                                            {summary.lastPlayed
                                                ? new Date(summary.lastPlayed).toLocaleString()
                                                : "Not yet played"}
                                        </span>
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-wrap gap-4 justify-center">
                        <Button
                            variant="primary"
                            onClick={() => router.push("/student/select")}
                        >
                            🎮 Go to Game
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                localStorage.removeItem("token");
                                router.push("/login");
                            }}
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

