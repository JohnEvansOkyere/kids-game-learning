"use client";

/**
 * SkillMap - a child's progress on each maths skill, for the parent dashboard
 *
 * Shows the child's own grade plus anything else they have practised.
 * Easier skills a child skipped are not shown as "behind": older kids start
 * at their own grade, and only the diagnostic (Phase B) can tell if they're behind.
 */
import React, { useState } from "react";
import type { GradeLevel, MasteryStatus, SkillMastery } from "@/lib/types";

const GRADES: GradeLevel[] = ["KG1", "KG2", "P1", "P2", "P3"];

// Enough answers to say a skill needs help, matching the backend's threshold
const MIN_ANSWERS_TO_JUDGE = 5;

const STATUS_STYLES: Record<MasteryStatus, { label: string; chip: string }> = {
    not_started: { label: "Not started", chip: "bg-gray-100 text-gray-600 border-gray-300" },
    learning: { label: "Learning", chip: "bg-orange-100 text-orange-800 border-orange-300" },
    practising: { label: "Practising", chip: "bg-sky-100 text-sky-800 border-sky-300" },
    mastered: { label: "Mastered ✓", chip: "bg-green-100 text-green-800 border-green-400" },
};

function needsHelp(m: SkillMastery) {
    return m.status === "learning" && m.attempts >= MIN_ANSWERS_TO_JUDGE;
}

export default function SkillMap({ mastery, gradeLevel }: { mastery: SkillMastery[]; gradeLevel: GradeLevel }) {
    const [showAll, setShowAll] = useState(false);

    const ownGrade = mastery.filter((m) => m.skill.gradeLevel === gradeLevel);
    const masteredOwn = ownGrade.filter((m) => m.status === "mastered").length;
    const weak = mastery.filter(needsHelp);
    const visible = showAll ? mastery : mastery.filter((m) => m.skill.gradeLevel === gradeLevel || m.attempts > 0);

    return (
        <div className="mt-4 border-t-2 border-gray-100 pt-4">
            <h4 className="text-xl font-bold text-primary mb-2">Maths skills</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl bg-green-50 border-2 border-green-200 p-3">
                    <p className="text-sm text-gray-600">{gradeLevel} skills mastered</p>
                    <p className="text-2xl font-bold text-green-700">
                        {masteredOwn} of {ownGrade.length}
                    </p>
                </div>
                <div className="rounded-2xl bg-orange-50 border-2 border-orange-200 p-3">
                    <p className="text-sm text-gray-600">Needs more practice</p>
                    {weak.length ? (
                        <p className="font-bold text-orange-800">{weak.map((m) => m.skill.title).join(", ")}</p>
                    ) : (
                        <p className="font-bold text-gray-700">Nothing yet 👍</p>
                    )}
                </div>
            </div>

            {GRADES.map((grade) => {
                const rows = visible.filter((m) => m.skill.gradeLevel === grade);
                if (!rows.length) return null;
                return (
                    <div key={grade} className="mb-3">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">
                            {grade}
                            {grade === gradeLevel && " · their grade"}
                        </p>
                        <ul className="space-y-2">
                            {rows.map((m) => {
                                const style = STATUS_STYLES[m.status];
                                return (
                                    <li
                                        key={m.skill.id}
                                        className="flex items-start justify-between gap-3 rounded-2xl bg-white border-2 border-gray-100 p-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-800">{m.skill.title}</p>
                                            <p className="text-sm text-gray-600">{m.skill.parentDescription}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {m.attempts > 0
                                                    ? `${m.attempts} answers · ${Math.round(m.recentAccuracy ?? 0)}% right recently`
                                                    : "Not practised yet"}
                                                {m.skill.naccaCode && ` · NaCCA ${m.skill.naccaCode}`}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full border-2 px-3 py-1 text-sm font-bold whitespace-nowrap ${style.chip}`}
                                        >
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
                className="text-primary font-bold hover:underline min-h-touch"
            >
                {showAll ? "Show fewer skills" : "Show all skills (KG1–P3)"}
            </button>
        </div>
    );
}
