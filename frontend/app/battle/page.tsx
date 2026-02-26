"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { practiceApi, getErrorMessage } from "@/lib/api";
import {
    playCorrectSFX,
    playWrongSFX,
    playVictorySFX,
} from "@/app/practice/GameAudio";
import type { Question, Student, Topic } from "@/lib/types";

const TOPICS: { id: Topic; label: string; icon: string }[] = [
    { id: "counting", label: "Counting", icon: "🔢" },
    { id: "addition", label: "Addition", icon: "➕" },
    { id: "subtraction", label: "Subtraction", icon: "➖" },
    { id: "multiplication", label: "Multiplication", icon: "✖️" },
];
const WIN_LEAD = 5;
type Step = "setup" | "play" | "result";

function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════════
   SVG Tug-of-War Scene — Ghanaian kids in kente cloth
   ═══════════════════════════════════════════════════════ */

function Person({
    cx,
    baseY,
    dir,
    colors,
    isFemale,
}: {
    cx: number;
    baseY: number;
    dir: 1 | -1;
    colors: { shirt: string; s1: string; s2: string };
    isFemale?: boolean;
}) {
    const skin = "#5D3A1A";
    const darkSkin = "#3D2210";
    const hair = "#000";
    const pants = "#1a1a2e";
    const shoes = "#3D2210";
    const headY = baseY - 72;
    const neckY = baseY - 58;
    const bodyTop = baseY - 56;
    const bodyMid = bodyTop + 16;
    const armY = baseY - 40;
    const lean = -dir * 26;

    return (
        <g>
            {/* Back leg — straight, bracing far behind */}
            <line x1={cx - 2 * dir} y1={baseY - 22} x2={cx - 30 * dir} y2={baseY}
                stroke={pants} strokeWidth={9} strokeLinecap="round" />
            <ellipse cx={cx - 32 * dir} cy={baseY + 2} rx={9} ry={4} fill={shoes} />

            {/* Front leg — bent knee */}
            <line x1={cx + 2 * dir} y1={baseY - 22} x2={cx + 14 * dir} y2={baseY - 10}
                stroke={pants} strokeWidth={9} strokeLinecap="round" />
            <line x1={cx + 14 * dir} y1={baseY - 10} x2={cx + 7 * dir} y2={baseY}
                stroke={pants} strokeWidth={9} strokeLinecap="round" />
            <ellipse cx={cx + 5 * dir} cy={baseY + 2} rx={9} ry={4} fill={shoes} />

            {/* Neck */}
            <rect x={cx - 4} y={neckY} width={8} height={7} rx={3} fill={skin} />

            {/* Body — kente shirt */}
            <g transform={`rotate(${lean}, ${cx}, ${bodyMid})`}>
                <rect x={cx - 15} y={bodyTop} width={30} height={34} rx={5} fill={colors.shirt} />
                <rect x={cx - 15} y={bodyTop + 8} width={30} height={5} fill={colors.s1} />
                <rect x={cx - 15} y={bodyTop + 17} width={30} height={4} fill={colors.s2} />
                <rect x={cx - 15} y={bodyTop + 25} width={30} height={4} fill={colors.s1} opacity={0.6} />
                <path d={`M ${cx - 8} ${bodyTop} Q ${cx} ${bodyTop + 6} ${cx + 8} ${bodyTop}`} fill={colors.s1} />
            </g>

            {/* Arms — taut toward rope */}
            <line x1={cx + 13 * dir} y1={armY - 4} x2={cx + 42 * dir} y2={armY}
                stroke={skin} strokeWidth={8} strokeLinecap="round" />
            <line x1={cx + 42 * dir} y1={armY} x2={cx + 62 * dir} y2={armY + 1}
                stroke={skin} strokeWidth={7} strokeLinecap="round" />
            <ellipse cx={cx + 64 * dir} cy={armY + 1} rx={5} ry={4} fill={darkSkin} />

            {/* Head */}
            <g transform={`rotate(${-dir * 10}, ${cx}, ${headY})`}>
                {/* Ears */}
                <ellipse cx={cx - 14} cy={headY + 2} rx={4} ry={5} fill={skin} />
                <ellipse cx={cx + 14} cy={headY + 2} rx={4} ry={5} fill={skin} />
                <ellipse cx={cx - 14} cy={headY + 2} rx={2.5} ry={3} fill={darkSkin} />
                <ellipse cx={cx + 14} cy={headY + 2} rx={2.5} ry={3} fill={darkSkin} />

                <ellipse cx={cx} cy={headY} rx={13} ry={14} fill={skin} stroke={darkSkin} strokeWidth={0.5} />

                {isFemale ? (
                    <>
                        <ellipse cx={cx} cy={headY - 6} rx={14} ry={10} fill={hair} />
                        <rect x={cx - 16} y={headY - 2} width={4} height={20} rx={2} fill={hair} />
                        <rect x={cx + 12} y={headY - 2} width={4} height={20} rx={2} fill={hair} />
                        <circle cx={cx - 14} cy={headY + 20} r={2.5} fill={colors.s1} />
                        <circle cx={cx + 14} cy={headY + 20} r={2.5} fill={colors.s1} />
                    </>
                ) : (
                    <>
                        <ellipse cx={cx} cy={headY - 8} rx={14} ry={9} fill={hair} />
                        <circle cx={cx - 7} cy={headY - 14} r={3.5} fill={hair} />
                        <circle cx={cx} cy={headY - 16} r={3.5} fill={hair} />
                        <circle cx={cx + 7} cy={headY - 14} r={3.5} fill={hair} />
                        <circle cx={cx - 4} cy={headY - 15} r={3} fill={hair} />
                        <circle cx={cx + 4} cy={headY - 15} r={3} fill={hair} />
                    </>
                )}

                <rect x={cx - 14} y={headY - 5} width={28} height={4} rx={2} fill={colors.s1} />
                <line x1={cx - 14} y1={headY - 3} x2={cx + 14} y2={headY - 3} stroke={colors.s2} strokeWidth={1.5} />

                {/* Eyebrows */}
                <line x1={cx + 1 * dir} y1={headY - 2} x2={cx + 6 * dir} y2={headY - 0.5} stroke={hair} strokeWidth={2} strokeLinecap="round" />
                <line x1={cx + 7 * dir} y1={headY - 2} x2={cx + 12 * dir} y2={headY - 0.5} stroke={hair} strokeWidth={2} strokeLinecap="round" />

                {/* Eyes */}
                <ellipse cx={cx + 4 * dir} cy={headY + 2} rx={3} ry={2} fill="white" />
                <ellipse cx={cx + 10 * dir} cy={headY + 2} rx={3} ry={2} fill="white" />
                <circle cx={cx + 4.5 * dir} cy={headY + 2} r={1.5} fill="#1a0a00" />
                <circle cx={cx + 10.5 * dir} cy={headY + 2} r={1.5} fill="#1a0a00" />

                {/* Nose */}
                <ellipse cx={cx + 7 * dir} cy={headY + 6} rx={2.5} ry={2} fill={darkSkin} />
                <circle cx={cx + 5.5 * dir} cy={headY + 7} r={0.8} fill="#1a0a00" />
                <circle cx={cx + 8.5 * dir} cy={headY + 7} r={0.8} fill="#1a0a00" />

                {/* Mouth — gritting teeth */}
                <rect x={Math.min(cx + 2 * dir, cx + 10 * dir)} y={headY + 10} width={8} height={3} rx={1} fill="#2a1508" />
                <line x1={cx + 3 * dir} y1={headY + 11.5} x2={cx + 9 * dir} y2={headY + 11.5} stroke="white" strokeWidth={1} />

                {/* Effort flush on cheeks */}
                <ellipse cx={cx + 1 * dir} cy={headY + 6} rx={3} ry={1.5} fill="#8B4513" opacity={0.3} />
            </g>

            {/* Sweat */}
            <ellipse cx={cx + 14 * dir} cy={headY - 4} rx={1.5} ry={2.5} fill="#87CEEB" opacity={0.7}>
                <animate attributeName="cy" values={`${headY - 4};${headY + 8};${headY - 4}`} dur="0.9s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="0.9s" repeatCount="indefinite" />
            </ellipse>
        </g>
    );
}

function TugOfWarScene({
    scoreP1,
    scoreP2,
}: {
    scoreP1: number;
    scoreP2: number;
}) {
    const diff = scoreP1 - scoreP2;
    const shiftX = Math.max(-130, Math.min(130, -(diff / WIN_LEAD) * 130));
    const baseY = 140;
    const ropeY = baseY - 37;

    const t1 = { shirt: "#2563EB", s1: "#F59E0B", s2: "#10B981" };
    const t2 = { shirt: "#DC2626", s1: "#F59E0B", s2: "#F97316" };

    return (
        <svg viewBox="0 0 500 160" className="w-full h-full min-h-[120px]" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="skyBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#87CEEB" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#4CAF50" stopOpacity={0.05} />
                </linearGradient>
            </defs>
            <rect x={0} y={0} width={500} height={160} fill="url(#skyBg)" />

            {/* Ground */}
            <rect x={0} y={baseY + 4} width={500} height={16} fill="#4CAF50" rx={2} />
            <rect x={0} y={baseY + 8} width={500} height={12} fill="#388E3C" rx={2} />
            {[25, 75, 140, 210, 290, 360, 425, 475].map((gx) => (
                <path key={gx} d={`M ${gx} ${baseY + 4} L ${gx + 3} ${baseY - 4} L ${gx + 6} ${baseY + 4}`} fill="#66BB6A" />
            ))}

            {/* ── Bright center line — the finish mark ── */}
            <line x1={250} y1={6} x2={250} y2={baseY + 4} stroke="#FFD700" strokeWidth={4} />
            <line x1={250} y1={6} x2={250} y2={baseY + 4} stroke="#FF6B00" strokeWidth={2} strokeDasharray="8,4" />
            {/* Glow effect */}
            <line x1={250} y1={6} x2={250} y2={baseY + 4} stroke="#FFD700" strokeWidth={8} opacity={0.15} />

            {/* ── Entire scene shifts: characters + rope move together ── */}
            <g style={{ transform: `translateX(${shiftX}px)`, transition: "transform 0.35s ease-out" }}>

                {/* Rope */}
                <line x1={15} y1={ropeY} x2={485} y2={ropeY} stroke="#D4A843" strokeWidth={7} strokeLinecap="round" />
                <line x1={15} y1={ropeY} x2={485} y2={ropeY} stroke="#8B6914" strokeWidth={4.5} strokeDasharray="3,5" strokeLinecap="round" />

                {/* Red ribbon at rope center */}
                <rect x={248} y={ropeY - 14} width={4} height={18} rx={1} fill="#DC2626" />
                <polygon points={`248,${ropeY - 14} 238,${ropeY - 7} 248,${ropeY}`} fill="#DC2626" opacity={0.8} />

                {/* Team 1 — heaving fast */}
                <g>
                    <animateTransform attributeName="transform" type="translate"
                        values="-5,0; 0,1; -5,0" dur="0.5s" repeatCount="indefinite" />
                    <Person cx={50} baseY={baseY} dir={1} colors={t1} isFemale />
                    <Person cx={125} baseY={baseY} dir={1} colors={t1} />
                </g>

                {/* Team 2 — heaving fast */}
                <g>
                    <animateTransform attributeName="transform" type="translate"
                        values="5,0; 0,1; 5,0" dur="0.55s" repeatCount="indefinite" />
                    <Person cx={375} baseY={baseY} dir={-1} colors={t2} />
                    <Person cx={450} baseY={baseY} dir={-1} colors={t2} isFemale />
                </g>
            </g>
        </svg>
    );
}

/* ═══════════════════════════════════════
   Number Pad (0-9 + clear + submit)
   ═══════════════════════════════════════ */

function NumPad({
    disabled,
    onDigit,
    onClear,
    onSubmit,
}: {
    disabled: boolean;
    onDigit: (n: number) => void;
    onClear: () => void;
    onSubmit: () => void;
}) {
    const btnBase =
        "h-12 sm:h-14 md:h-16 rounded-xl font-bold text-lg md:text-xl lg:text-2xl transition-colors active:scale-95 disabled:opacity-40 select-none";

    return (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => onDigit(n)}
                    className={`${btnBase} bg-gray-700 hover:bg-gray-600 text-white`}
                >
                    {n}
                </button>
            ))}
            <button
                type="button"
                disabled={disabled}
                onClick={onClear}
                className={`${btnBase} bg-red-600 hover:bg-red-500 text-white`}
            >
                ✕
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onDigit(0)}
                className={`${btnBase} bg-gray-700 hover:bg-gray-600 text-white`}
            >
                0
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={onSubmit}
                className={`${btnBase} bg-blue-600 hover:bg-blue-500 text-white`}
            >
                ✔
            </button>
        </div>
    );
}

/* ═══════════════════════════════════════
   Team Panel (question + answer + numpad)
   ═══════════════════════════════════════ */

function TeamPanel({
    team,
    score,
    question,
    answer,
    flash,
    disabled,
    onDigit,
    onClear,
    onSubmit,
}: {
    team: 1 | 2;
    score: number;
    question: Question | undefined;
    answer: string;
    flash: null | "correct" | "wrong";
    disabled: boolean;
    onDigit: (n: number) => void;
    onClear: () => void;
    onSubmit: () => void;
}) {
    const isT1 = team === 1;
    const headerBg = isT1 ? "bg-blue-700" : "bg-red-700";
    const borderClr = isT1 ? "border-blue-500/60" : "border-red-500/60";
    const qColor = isT1 ? "text-blue-300" : "text-red-300";

    let answerBorder = "border-gray-600";
    let answerBg = "bg-gray-800";
    if (flash === "correct") {
        answerBorder = "border-green-400";
        answerBg = "bg-green-900/40";
    } else if (flash === "wrong") {
        answerBorder = "border-red-400";
        answerBg = "bg-red-900/40";
    }

    return (
        <div
            className={`rounded-2xl border-2 ${borderClr} overflow-hidden bg-gray-900/80 min-w-0 flex flex-col h-full`}
        >
            {/* Coloured header */}
            <div
                className={`${headerBg} px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between flex-shrink-0`}
            >
                <span className="text-white font-bold text-lg sm:text-xl md:text-2xl">
                    Team {team}
                </span>
                <span className="bg-white/20 backdrop-blur text-white font-bold rounded-full w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl md:text-2xl">
                    {score}
                </span>
            </div>

            <div className="p-3 sm:p-4 pb-6 sm:pb-8 md:pb-10 flex-1 flex flex-col min-h-0">
                {/* Question */}
                <div
                    className={`${qColor} text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center mb-2 sm:mb-3 min-h-[44px] sm:min-h-[52px] md:min-h-[64px] flex items-center justify-center leading-tight flex-shrink-0`}
                >
                    {question?.questionText || "..."}
                </div>

                {/* Answer display */}
                <div
                    className={`w-full h-12 sm:h-14 md:h-16 rounded-xl border-2 ${answerBorder} ${answerBg} flex items-center justify-end px-4 text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 transition-colors flex-shrink-0 ${answer ? "text-white" : "text-gray-500"}`}
                >
                    {answer || "0"}
                </div>

                {/* Keypad — pushed down with space below */}
                <div className="mt-auto mb-0">
                    <NumPad
                    disabled={disabled}
                    onDigit={onDigit}
                    onClear={onClear}
                    onSubmit={onSubmit}
                />
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   Main Battle Page
   ═══════════════════════════════════════ */

export default function BattlePage() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [step, setStep] = useState<Step>("setup");
    const [topic, setTopic] = useState<Topic | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [questionsP1, setQuestionsP1] = useState<Question[]>([]);
    const [questionsP2, setQuestionsP2] = useState<Question[]>([]);
    const [indexP1, setIndexP1] = useState(0);
    const [indexP2, setIndexP2] = useState(0);
    const [scoreP1, setScoreP1] = useState(0);
    const [scoreP2, setScoreP2] = useState(0);
    const [answerP1, setAnswerP1] = useState("");
    const [answerP2, setAnswerP2] = useState("");
    const [flashP1, setFlashP1] = useState<null | "correct" | "wrong">(null);
    const [flashP2, setFlashP2] = useState<null | "correct" | "wrong">(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<1 | 2 | null>(null);
    const [winBanner, setWinBanner] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);

    /* Load student */
    useEffect(() => {
        const raw = localStorage.getItem("selectedStudent");
        if (!raw) {
            router.push("/student/select");
            return;
        }
        try {
            setStudent(JSON.parse(raw));
        } catch {
            router.push("/student/select");
        }
    }, [router]);

    /* Elapsed timer */
    useEffect(() => {
        if (step !== "play" || gameOver) return;
        const id = setInterval(() => setTimer((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, [step, gameOver]);

    /* Start battle — fetch questions and split between teams */
    const startBattle = useCallback(async () => {
        if (!student || !topic) return;
        setLoading(true);
        setError("");
        try {
            const res = await practiceApi.start({
                studentId: student.id,
                topic,
                gradeLevel: student.gradeLevel,
            });
            const qs = res.questions;
            if (qs.length < 6) {
                setError("Not enough questions. Try another topic.");
                return;
            }
            setQuestionsP1(qs.filter((_, i) => i % 2 === 0));
            setQuestionsP2(qs.filter((_, i) => i % 2 === 1));
            setIndexP1(0);
            setIndexP2(0);
            setScoreP1(0);
            setScoreP2(0);
            setAnswerP1("");
            setAnswerP2("");
            setFlashP1(null);
            setFlashP2(null);
            setGameOver(false);
            setWinner(null);
            setWinBanner(null);
            setTimer(0);
            setStep("play");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [student, topic]);

    /* Digit press */
    const handleDigit = useCallback(
        (player: 1 | 2, digit: number) => {
            if (gameOver) return;
            if (player === 1 && flashP1 !== null) return;
            if (player === 2 && flashP2 !== null) return;
            const setter = player === 1 ? setAnswerP1 : setAnswerP2;
            setter((prev) => {
                if (prev === "" || prev === "0")
                    return digit === 0 ? "0" : String(digit);
                if (prev.length >= 4) return prev;
                return prev + String(digit);
            });
        },
        [gameOver, flashP1, flashP2]
    );

    /* Clear */
    const handleClear = useCallback(
        (player: 1 | 2) => {
            if (gameOver) return;
            if (player === 1) setAnswerP1("");
            else setAnswerP2("");
        },
        [gameOver]
    );

    /* Submit answer (mark ✔) */
    const handleSubmit = useCallback(
        (player: 1 | 2) => {
            if (gameOver) return;
            const answer = player === 1 ? answerP1 : answerP2;
            const qs = player === 1 ? questionsP1 : questionsP2;
            const idx = player === 1 ? indexP1 : indexP2;
            const flash = player === 1 ? flashP1 : flashP2;

            if (!answer || flash !== null) return;

            const value = parseInt(answer, 10);
            if (Number.isNaN(value)) return;

            if (qs.length === 0) return;
            const q = qs[idx % qs.length];

            const setFlash = player === 1 ? setFlashP1 : setFlashP2;
            const setAnswer = player === 1 ? setAnswerP1 : setAnswerP2;
            const setScore = player === 1 ? setScoreP1 : setScoreP2;
            const setIndex = player === 1 ? setIndexP1 : setIndexP2;

            if (value === q.correctAnswer) {
                try { playCorrectSFX(); } catch {}
                setFlash("correct");
                setScore((prev) => prev + 1);
                setTimeout(() => {
                    setFlash(null);
                    setAnswer("");
                    setIndex((prev) => prev + 1);
                }, 400);
            } else {
                try { playWrongSFX(); } catch {}
                setFlash("wrong");
                setTimeout(() => {
                    setFlash(null);
                    setAnswer("");
                }, 500);
            }
        },
        [
            gameOver,
            answerP1,
            answerP2,
            questionsP1,
            questionsP2,
            indexP1,
            indexP2,
            flashP1,
            flashP2,
        ]
    );

    /* Win check — rope pulled fully past center line */
    useEffect(() => {
        if (step !== "play" || gameOver) return;
        const diff = scoreP1 - scoreP2;
        if (Math.abs(diff) >= WIN_LEAD) {
            setGameOver(true);
            const w: 1 | 2 = diff > 0 ? 1 : 2;
            setWinBanner(w === 1 ? "Team 1 pulled them over!" : "Team 2 pulled them over!");
            try { playVictorySFX(); } catch {}
            setTimeout(() => {
                setWinner(w);
                setStep("result");
            }, 2000);
        }
    }, [scoreP1, scoreP2, step, gameOver]);

    /* ─── Loading guard ─── */
    if (!student) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-2xl text-gray-400">Loading...</p>
            </div>
        );
    }

    /* ═══════════════════════════
       SETUP SCREEN
       ═══════════════════════════ */
    if (step === "setup") {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-primary mb-2">
                            ⚔️ Tug of War Battle
                        </h1>
                        <p className="text-xl text-gray-600">
                            Two teams pull the rope! Answer correctly to pull.
                            First team to drag the rope fully to their side wins!
                        </p>
                    </div>

                    {error && (
                        <div className="bg-danger/10 border-4 border-danger rounded-2xl p-4 mb-6">
                            <p className="text-danger font-bold text-center">
                                {error}
                            </p>
                        </div>
                    )}

                    <Card colorful className="p-6 mb-6">
                        <h2 className="text-2xl font-bold text-primary mb-4">
                            Choose topic
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {TOPICS.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTopic(t.id)}
                                    className={`p-4 rounded-2xl border-4 text-left transition-all ${
                                        topic === t.id
                                            ? "border-primary bg-primary/20"
                                            : "border-gray-300 hover:border-primary/50"
                                    }`}
                                >
                                    <span className="text-3xl">{t.icon}</span>
                                    <span className="block font-bold text-lg mt-2">
                                        {t.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Card>

                    <div className="flex gap-4 justify-center">
                        <Button
                            variant="secondary"
                            onClick={() => router.push("/dashboard")}
                        >
                            ← Back
                        </Button>
                        <Button
                            variant="primary"
                            onClick={startBattle}
                            disabled={!topic || loading}
                        >
                            {loading ? "Loading..." : "Start Battle"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════
       RESULT SCREEN
       ═══════════════════════════ */
    if (step === "result") {
        return (
            <div className="min-h-screen bg-gray-950">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
                    <h2 className="text-4xl font-bold text-white mb-2">
                        {winner === 1 && "Team 1 Wins! 🎉"}
                        {winner === 2 && "Team 2 Wins! 🎉"}
                        {winner === null && "It's a Tie! 🤝"}
                    </h2>
                    <p className="text-2xl text-gray-300 mb-2">
                        {scoreP1} – {scoreP2}
                    </p>
                    <p className="text-gray-500 mb-6">
                        Time: {formatTime(timer)}
                    </p>

                    <div className="max-w-lg mx-auto mb-8">
                        <TugOfWarScene
                            scoreP1={scoreP1}
                            scoreP2={scoreP2}
                        />
                    </div>

                    <div className="flex gap-4 justify-center">
                        <Button
                            variant="primary"
                            onClick={() => {
                                setStep("setup");
                                setTopic(null);
                            }}
                        >
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
            </div>
        );
    }

    /* ═══════════════════════════
       PLAY SCREEN  (3-column, full viewport)
       ═══════════════════════════ */
    return (
        <div className="min-h-screen h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 overflow-hidden">
            {/* Top bar — full width */}
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex-shrink-0">
                <button
                    onClick={() => {
                        if (confirm("Leave battle?")) setStep("setup");
                    }}
                    className="text-gray-400 hover:text-white font-bold text-sm sm:text-base"
                >
                    ← Back
                </button>
                <h1 className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl tracking-wide text-center truncate mx-2">
                    TUG OF WAR: MATHEMATICS
                </h1>
                <span className="text-gray-400 text-sm font-mono whitespace-nowrap">
                    ⏱ {formatTime(timer)}
                </span>
            </div>

            {/* Win banner */}
            {winBanner && (
                <div className="text-center py-2 sm:py-3 px-4 flex-shrink-0 animate-pulse bg-yellow-500/20 border-y-2 border-yellow-400/50">
                    <p className="text-yellow-300 text-lg sm:text-xl md:text-2xl font-bold">{winBanner}</p>
                </div>
            )}

            {/* Main area — fills remaining space, full width */}
            <div className="flex-1 min-h-0 w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-4 flex flex-col">
                <div className="grid grid-cols-[1fr_1.1fr_1fr] lg:grid-cols-[1fr_1.3fr_1fr] gap-3 sm:gap-4 md:gap-6 flex-1 min-h-0 items-stretch max-w-[1920px] mx-auto w-full">
                    {/* ── Team 1 panel ── */}
                    <TeamPanel
                        team={1}
                        score={scoreP1}
                        question={questionsP1.length ? questionsP1[indexP1 % questionsP1.length] : undefined}
                        answer={answerP1}
                        flash={flashP1}
                        disabled={flashP1 !== null || gameOver}
                        onDigit={(n) => handleDigit(1, n)}
                        onClear={() => handleClear(1)}
                        onSubmit={() => handleSubmit(1)}
                    />

                    {/* ── Center: scoreboard + illustration ── */}
                    <div className="flex flex-col items-center justify-center min-h-0 flex-1">
                        {/* Scoreboard */}
                        <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2 flex-shrink-0">
                            <span className="text-blue-400 font-bold text-sm sm:text-base md:text-lg">
                                Team 1
                            </span>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                                    {scoreP1}
                                </span>
                                <span className="text-gray-500 text-lg sm:text-xl">–</span>
                                <span className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                                    {scoreP2}
                                </span>
                            </div>
                            <span className="text-red-400 font-bold text-sm sm:text-base md:text-lg">
                                Team 2
                            </span>
                        </div>

                        {/* SVG scene — grows to fill space */}
                        <div className="w-full flex-1 min-h-[140px] sm:min-h-[180px] md:min-h-[220px] lg:min-h-[280px] flex items-center justify-center">
                            <TugOfWarScene
                                scoreP1={scoreP1}
                                scoreP2={scoreP2}
                            />
                        </div>
                    </div>

                    {/* ── Team 2 panel ── */}
                    <TeamPanel
                        team={2}
                        score={scoreP2}
                        question={questionsP2.length ? questionsP2[indexP2 % questionsP2.length] : undefined}
                        answer={answerP2}
                        flash={flashP2}
                        disabled={flashP2 !== null || gameOver}
                        onDigit={(n) => handleDigit(2, n)}
                        onClear={() => handleClear(2)}
                        onSubmit={() => handleSubmit(2)}
                    />
                </div>
            </div>
        </div>
    );
}
