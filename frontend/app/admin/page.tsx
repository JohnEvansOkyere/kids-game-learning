"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { adminApi } from "@/lib/api";
import type { AdminOverview } from "@/lib/types";

const RANGES = [7, 30, 90];

function pct(value: number | null | undefined): string {
    return value === null || value === undefined ? "–" : `${value}%`;
}

function minutesSeconds(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m ? `${m}m ${s}s` : `${s}s`;
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
    return (
        <div className="px-4 py-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
            <p className="mt-0.5 font-display text-2xl font-semibold text-ink">{value}</p>
            {hint && <p className="text-xs font-semibold text-ink-muted">{hint}</p>}
        </div>
    );
}

/** Plain SVG bars: one bar per day, so there is no chart library to ship */
function DayBars({ title, data, label }: { title: string; data: { day: string; value: number }[]; label: string }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const width = 600;
    const height = 120;
    const gap = 2;
    const barWidth = Math.max(2, (width - gap * (data.length - 1)) / data.length);

    return (
        <section className="card !p-5">
            <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
                <p className="text-sm font-semibold text-ink-muted">
                    {total} {label} in {data.length} days
                </p>
            </div>
            <svg
                viewBox={`0 0 ${width} ${height + 18}`}
                className="mt-3 w-full"
                role="img"
                aria-label={`${title}: ${total} ${label} over the last ${data.length} days`}
            >
                {data.map((d, i) => {
                    const h = d.value ? Math.max(3, (d.value / max) * height) : 1;
                    return (
                        <rect
                            key={d.day}
                            x={i * (barWidth + gap)}
                            y={height - h}
                            width={barWidth}
                            height={h}
                            rx={2}
                            fill={d.value ? "#1D4ED8" : "#DBE4FA"}
                        >
                            <title>{`${d.day}: ${d.value}`}</title>
                        </rect>
                    );
                })}
                <text x={0} y={height + 14} fontSize={11} fill="#5A6FA8">
                    {data[0]?.day}
                </text>
                <text x={width} y={height + 14} fontSize={11} fill="#5A6FA8" textAnchor="end">
                    {data[data.length - 1]?.day}
                </text>
            </svg>
        </section>
    );
}

function AccuracyBar({ value }: { value: number }) {
    return (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary/10" aria-hidden>
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
        </div>
    );
}

export default function AdminPage() {
    const router = useRouter();
    const [days, setDays] = useState(30);
    const [data, setData] = useState<AdminOverview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = useCallback(
        async (range: number) => {
            if (!localStorage.getItem("token")) {
                router.push("/login");
                return;
            }
            setLoading(true);
            setError(null);
            try {
                setData(await adminApi.overview(range));
            } catch (e) {
                const status = (e as AxiosError).response?.status;
                if (status === 401) router.push("/login");
                else if (status === 403) setForbidden(true);
                else setError("Could not load the numbers. Try again in a moment.");
            } finally {
                setLoading(false);
            }
        },
        [router]
    );

    useEffect(() => {
        load(days);
    }, [days, load]);

    if (forbidden) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="mx-auto max-w-md px-4 pt-20 text-center">
                    <h1 className="font-display text-3xl font-semibold text-ink">Admins only</h1>
                    <p className="mt-2 font-semibold text-ink-muted">This page is for the MathChampions team.</p>
                    <Button variant="primary" className="mt-6" onClick={() => router.push("/parent/dashboard")}>
                        Back to my dashboard
                    </Button>
                </div>
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
                            Super admin
                        </p>
                        <h1 className="font-display text-4xl font-semibold text-ink">App performance</h1>
                        {data && (
                            <p className="mt-1 text-sm font-semibold text-ink-muted">
                                Updated {new Date(data.generatedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2" role="group" aria-label="Time range">
                        {RANGES.map((r) => (
                            <button
                                key={r}
                                onClick={() => setDays(r)}
                                aria-pressed={days === r}
                                className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                                    days === r ? "bg-primary text-white" : "bg-primary/10 text-ink-soft"
                                }`}
                            >
                                {r} days
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <p role="alert" className="mt-6 rounded-xl bg-secondary/30 px-4 py-3 font-semibold text-danger-dark">
                        {error}
                    </p>
                )}
                {loading && !data && <p className="mt-6 text-center font-semibold text-ink-muted">Loading…</p>}

                {data && (
                    <div className={loading ? "opacity-60 transition-opacity" : ""}>
                        <div className="card !p-0 mt-6 grid grid-cols-2 divide-x divide-y divide-ink/10 overflow-hidden md:grid-cols-4">
                            <Stat label="Parents" value={data.totals.parents} />
                            <Stat label="Children" value={data.totals.students} />
                            <Stat
                                label="Sessions"
                                value={data.totals.sessions}
                                hint={`${pct(data.totals.completionPercent)} finished`}
                            />
                            <Stat
                                label="Answers"
                                value={data.totals.answers}
                                hint={`${pct(data.totals.accuracyPercent)} correct`}
                            />
                        </div>

                        <div className="card !p-0 mt-4 grid grid-cols-2 divide-x divide-y divide-ink/10 overflow-hidden md:grid-cols-4 md:divide-y-0">
                            <Stat label="Played today" value={data.activeStudents.day} />
                            <Stat label="Played this week" value={data.activeStudents.week} />
                            <Stat label="Played this month" value={data.activeStudents.month} />
                            <Stat label="Questions in bank" value={data.totals.questions} />
                        </div>

                        <div className="card !p-0 mt-4 grid grid-cols-2 divide-x divide-y divide-ink/10 overflow-hidden md:grid-cols-4 md:divide-y-0">
                            <Stat label="Day-1 return" value={pct(data.retention.day1ReturnPercent)} hint="came back next day" />
                            <Stat label="Day-7 return" value={pct(data.retention.day7ReturnPercent)} hint="came back a week later" />
                            <Stat label="Sessions / week" value={data.retention.avgSessionsPerWeek ?? "–"} hint="per player" />
                            <Stat label="Tracked players" value={data.retention.players} hint="have sent events" />
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <DayBars
                                title="New parents"
                                label="sign-ups"
                                data={data.signupsByDay.map((d) => ({ day: d.day, value: d.signups }))}
                            />
                            <DayBars
                                title="Practice sessions"
                                label="sessions"
                                data={data.activityByDay.map((d) => ({ day: d.day, value: d.sessions }))}
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <section className="card !p-5">
                                <h2 className="font-display text-xl font-semibold text-ink">By topic</h2>
                                {data.byTopic.length === 0 && (
                                    <p className="mt-3 font-semibold text-ink-muted">No sessions yet.</p>
                                )}
                                <ul className="mt-3 space-y-4">
                                    {data.byTopic.map((t) => (
                                        <li key={t.topic}>
                                            <div className="flex items-baseline justify-between gap-3">
                                                <span className="font-bold capitalize text-ink">{t.topic}</span>
                                                <span className="text-sm font-semibold text-ink-muted">
                                                    {t.sessions} sessions · {minutesSeconds(t.avgSeconds)} avg ·{" "}
                                                    {pct(t.accuracyPercent)}
                                                </span>
                                            </div>
                                            <AccuracyBar value={t.accuracyPercent} />
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="card !p-5">
                                <h2 className="font-display text-xl font-semibold text-ink">By grade</h2>
                                <ul className="mt-3 space-y-4">
                                    {data.byGrade.map((g) => (
                                        <li key={g.grade}>
                                            <div className="flex items-baseline justify-between gap-3">
                                                <span className="font-bold text-ink">{g.grade}</span>
                                                <span className="text-sm font-semibold text-ink-muted">
                                                    {g.students} children · {g.sessions} sessions · {pct(g.accuracyPercent)}
                                                </span>
                                            </div>
                                            <AccuracyBar value={g.accuracyPercent} />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        <section className="card !p-5 mt-6">
                            <h2 className="font-display text-xl font-semibold text-ink">Hardest questions</h2>
                            <p className="text-sm font-semibold text-ink-muted">
                                Lowest share answered correctly, at least 10 attempts. Worth checking they are fair.
                            </p>
                            {data.hardestQuestions.length === 0 ? (
                                <p className="mt-3 font-semibold text-ink-muted">Not enough answers yet.</p>
                            ) : (
                                <ul className="mt-3 divide-y divide-ink/10">
                                    {data.hardestQuestions.map((q, i) => (
                                        <li key={i} className="flex items-start justify-between gap-4 py-2.5">
                                            <div>
                                                <p className="font-bold text-ink">{q.text}</p>
                                                <p className="text-xs font-semibold capitalize text-ink-muted">
                                                    {q.grade} · {q.topic}
                                                </p>
                                            </div>
                                            <p className="shrink-0 text-right font-display text-lg font-semibold text-ink">
                                                {pct(q.accuracyPercent)}
                                                <span className="block text-xs font-semibold text-ink-muted">
                                                    {q.attempts} tries
                                                </span>
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
