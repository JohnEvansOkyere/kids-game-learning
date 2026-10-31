"use client";

/**
 * SkillMap - a child's progress on each maths skill, for the parent dashboard
 *
 * Shows the child's own grade plus anything else they have practised.
 * Easier skills a child skipped are not shown as "behind": older kids start
 * at their own grade, and only the diagnostic (Phase B) can tell if they're behind.
 */
import React, { useState } from "react";
import { CheckIcon } from "@/components/ui/Icons";
import type { GradeLevel, MasteryStatus, SkillMastery } from "@/lib/types";

const GRADES: GradeLevel[] = ["KG1", "KG2", "P1", "P2", "P3"];

// Enough answers to say a skill needs help, matching the backend's threshold
const MIN_ANSWERS_TO_JUDGE = 5;

const STATUS_STYLES: Record<MasteryStatus, { label: string; chip: string }> = {
    not_started: { label: "Not started", chip: "bg-ink/5 text-ink-muted" },
    learning: { label: "Learning", chip: "bg-orange-100 text-orange-800" },
    practising: { label: "Practising", chip: "bg-sky-100 text-sky-800" },
    mastered: { label: "Mastered", chip: "bg-success/15 text-success-dark" },
};

function needsHelp(m: SkillMastery) {
    return m.status === "learning" && m.attempts >= MIN_ANSWERS_TO_JUDGE;
}

export default function SkillMap({ mastery, gradeLevel }: { mastery: SkillMastery[]; gradeLevel: GradeLevel }) {
    const [showAll, setShowAll] = useState(false);

    const ownGrade = mastery.filter((m) => m.skill.gradeLevel === gradeLevel);
    const masteredOwn = ownGrade.filter((m) => m.status === "mastered").length;
    const masteredPercent = ownGrade.length ? Math.round((masteredOwn / ownGrade.length) * 100) : 0;
    const weak = mastery.filter(needsHelp);
    const visible = showAll ? mastery : mastery.filter((m) => m.skill.gradeLevel === gradeLevel || m.attempts > 0);

    return (
        <div className="mt-7 border-t border-ink/10 pt-6">
            <h3 className="font-display text-xl font-semibold text-ink">Maths skills</h3>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-success/10 p-4">
                    <p className="text-sm font-semibold text-ink-soft">{gradeLevel} skills mastered</p>
                    <p className="font-display text-3xl font-semibold text-success-dark">
                        {masteredOwn} <span className="text-xl text-ink-muted">of {ownGrade.length}</span>
                    </p>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/10">
                        <div className="h-full rounded-full bg-success" style={{ width: `${masteredPercent}%` }} />
                    </div>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-sm font-semibold text-ink-soft">Needs more practice</p>
                    {weak.length ? (
                        <p className="mt-1 font-display text-lg font-semibold text-orange-800">
                            {weak.map((m) => m.skill.title).join(", ")}
                        </p>
                    ) : (
                        <p className="mt-1 font-display text-lg font-semibold text-ink-soft">Nothing yet 👍</p>
                    )}
                </div>
            </div>

            {GRADES.map((grade) => {
                const rows = visible.filter((m) => m.skill.gradeLevel === grade);
                if (!rows.length) return null;
                return (
                    <div key={grade} className="mt-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
                            {grade}
                            {grade === gradeLevel && " · their grade"}
                        </p>
                        <ul className="space-y-2">
                            {rows.map((m) => {
                                const style = STATUS_STYLES[m.status];
                                return (
                                    <li
                                        key={m.skill.id}
                                        className="flex items-start justify-between gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-ink/10"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-display text-base font-semibold text-ink">{m.skill.title}</p>
                                            <p className="text-sm font-semibold text-ink-soft">{m.skill.parentDescription}</p>
                                            <p className="mt-1 text-xs font-semibold text-ink-muted">
                                                {m.attempts > 0
                                                    ? `${m.attempts} answers · ${Math.round(m.recentAccuracy ?? 0)}% right recently`
                                                    : "Not practised yet"}
                                                {m.skill.naccaCode && ` · NaCCA ${m.skill.naccaCode}`}
                                            </p>
                                        </div>
                                        <span
                                            className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold ${style.chip}`}
                                        >
                                            {m.status === "mastered" && <CheckIcon size={14} />}
                                            {style.label}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}

            <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mt-4 min-h-touch font-display text-base font-semibold text-primary hover:underline"
            >
                {showAll ? "Show fewer skills" : "Show all skills (KG1–P3)"}
            </button>
        </div>
    );
}
