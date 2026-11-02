"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { practiceApi, getErrorMessage } from "@/lib/api";
import {
    playCorrectSFX,
    playWrongSFX,
    playVictorySFX,
    startBackgroundMusic,
    stopBackgroundMusic,
} from "@/app/practice/GameAudio";
import NodeResult from "@/components/world/NodeResult";
import RewardBurst from "@/components/world/RewardBurst";
import { GameTopBar } from "@/components/games/GameScreen";
import { CheckIcon, ChevronLeftIcon } from "@/components/ui/Icons";
import { findNode, getNodeIdFromUrl, loadWorld } from "@/lib/world";
import { cacheQuestions, pickCachedQuestions } from "@/lib/questionCache";
import { recordOfflineAnswer, startOfflineSession } from "@/lib/offlineAnswers";
import type { GradeLevel, Question, Student, Topic, WorldNode } from "@/lib/types";

const TOPICS: { id: Topic; label: string; icon: string }[] = [
    { id: "counting", label: "Counting", icon: "🔢" },
    { id: "addition", label: "Addition", icon: "➕" },
    { id: "subtraction", label: "Subtraction", icon: "➖" },
    { id: "multiplication", label: "Multiplication", icon: "✖️" },
];
const WIN_LEAD = 5;
// Boss mode: how often the computer pulls the rope, by grade (ms, before jitter)
const BOSS_PULL_MS: Record<GradeLevel, number> = {
    KG1: 9000,
    KG2: 8500,
    P1: 8000,
    P2: 7500,
    P3: 7000,
};
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
            <ellipse cx={cx + 14 * dir} cy={headY - 4} rx={1.5} ry={2.5} fill="#FFFFFF" opacity={0.9}>
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

    const t1 = { shirt: "#FFFFFF", s1: "#FFC21A", s2: "#FFFFFF" };
    const t2 = { shirt: "#FFC21A", s1: "#FFFFFF", s2: "#FFC21A" };

    return (
        <svg viewBox="0 0 500 160" className="w-full h-full min-h-[120px]" preserveAspectRatio="xMidYMid meet">
            {/* Ground: one flat white strip on the blue stage */}
            <rect x={0} y={baseY + 4} width={500} height={16} fill="#FFFFFF" rx={2} />

            {/* ── Bright center line — the finish mark ── */}
            <line x1={250} y1={6} x2={250} y2={baseY + 4} stroke="#FFC21A" strokeWidth={4} strokeDasharray="8,4" />

            {/* ── Entire scene shifts: characters + rope move together ── */}
            <g style={{ transform: `translateX(${shiftX}px)`, transition: "transform 0.35s ease-out" }}>

                {/* Rope */}
                <line x1={15} y1={ropeY} x2={485} y2={ropeY} stroke="#FFC21A" strokeWidth={7} strokeLinecap="round" />
                <line x1={15} y1={ropeY} x2={485} y2={ropeY} stroke="#FFFFFF" strokeWidth={4.5} strokeDasharray="3,5" strokeLinecap="round" />

                {/* Ribbon at rope center */}
                <rect x={248} y={ropeY - 14} width={4} height={18} rx={1} fill="#FFFFFF" />
                <polygon points={`248,${ropeY - 14} 238,${ropeY - 7} 248,${ropeY}`} fill="#FFFFFF" />

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
    // The shared 3D key, squeezed to fit a narrow panel. The bottom margin
    // leaves room for the key's "ledge" shadow so rows never touch.
    const btnBase = "!min-h-0 !px-0 mb-1 h-12 sm:h-14 md:h-16 !text-xl md:!text-2xl lg:!text-3xl";

    return (
        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 sm:gap-x-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => onDigit(n)}
                    className={`btn ${btnBase}`}
                >
                    {n}
                </button>
            ))}
            <button
                type="button"
                aria-label="Clear"
                disabled={disabled}
                onClick={onClear}
                className={`btn-danger ${btnBase}`}
            >
                ✕
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onDigit(0)}
                className={`btn ${btnBase}`}
            >
                0
            </button>
            <button
                type="button"
                aria-label="Submit answer"
                disabled={disabled}
                onClick={onSubmit}
                className={`btn-success ${btnBase}`}
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
    label,
    stacked = false,
    className = "",
}: {
    label?: string;
    // On a phone the panel gets the full width (boss mode): bigger question,
    // and no header, because the scoreboard above already shows name and score
    stacked?: boolean;
    className?: string;
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
    // Team 1 is blue with white text, team 2 yellow with blue text. The panel itself is white.
    const headerBg = isT1 ? "bg-primary text-white" : "bg-secondary text-ink";
    const ringClr = "ring-white";

    let answerRing = "ring-primary/30";
    let answerBg = "bg-primary/10";
    if (flash === "correct") {
        answerRing = "ring-primary";
        answerBg = "bg-primary/20";
    } else if (flash === "wrong") {
        answerRing = "ring-secondary";
        answerBg = "bg-secondary/40";
    }

    return (
        <div
            className={`rounded-3xl ring-2 ${ringClr} overflow-hidden bg-white min-w-0 flex flex-col h-full ${className}`}
        >
            {/* Coloured header */}
            <div
                className={`${headerBg} px-3 py-2 sm:px-4 sm:py-3 items-center justify-between flex-shrink-0 ${stacked ? "hidden sm:flex" : "flex"}`}
            >
                <span className="font-display font-semibold text-lg sm:text-xl md:text-2xl truncate">
                    {label ?? `Team ${team}`}
                </span>
                <span className="bg-white text-primary font-display font-semibold rounded-full w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl md:text-2xl">
                    {score}
                </span>
            </div>

            <div className="p-3 sm:p-4 pb-5 sm:pb-7 md:pb-9 flex-1 flex flex-col min-h-0">
                {/* Question */}
                <div
                    className={`text-ink font-display font-semibold ${stacked ? "text-3xl" : "text-base"} sm:text-lg md:text-xl lg:text-3xl text-center mb-2 sm:mb-3 min-h-[44px] sm:min-h-[52px] md:min-h-[64px] flex items-center justify-center leading-tight flex-shrink-0`}
                >
                    {question?.questionText || "..."}
                </div>

                {/* Answer display */}
                <div
                    className={`w-full ${stacked ? "h-14" : "h-12"} sm:h-14 md:h-16 rounded-2xl ring-2 ${answerRing} ${answerBg} flex items-center justify-end px-4 font-display text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3 transition-colors flex-shrink-0 ${answer ? "text-ink" : "text-ink-muted"} ${flash === "wrong" ? "animate-shake" : ""}`}
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

/* Computer opponent shown in place of Team 2 in boss mode */
function BossPanel({
    boss,
    score,
    gameOver,
    className = "",
}: {
    boss: WorldNode;
    score: number;
    gameOver: boolean;
    className?: string;
}) {
    return (
        <div className={`rounded-3xl ring-2 ring-white overflow-hidden bg-white min-w-0 flex flex-col h-full ${className}`}>
            <div className="bg-secondary text-ink px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between flex-shrink-0">
                {/* Phone: one slim strip with the boss's face. Tablet and up: the big panel below. */}
                <span className="font-display font-semibold text-lg sm:hidden truncate">
                    <span className={`inline-block ${gameOver ? "" : "animate-float"}`}>{boss.emoji}</span> {boss.title}
                </span>
                <span className="hidden sm:inline font-display font-semibold text-xl md:text-2xl truncate">BOSS</span>
                <span className="bg-white text-primary font-display font-semibold rounded-full w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl md:text-2xl">
                    {score}
                </span>
            </div>
            <div className="hidden sm:flex flex-1 flex-col items-center justify-center p-4 text-center">
                <span className={`text-6xl sm:text-7xl md:text-8xl ${gameOver ? "" : "animate-float"}`}>{boss.emoji}</span>
                <p className="text-ink font-display font-semibold text-lg sm:text-xl md:text-2xl mt-3">{boss.title}</p>
                {!gameOver && <p className="text-ink-muted mt-2 animate-pulse">is pulling the rope...</p>}
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
    // Boss mode: launched from the Adventure World map (?node=...)
    const [nodeId, setNodeId] = useState<string | null>(null);
    const [boss, setBoss] = useState<WorldNode | null>(null);
    const [attemptsP1, setAttemptsP1] = useState(0);
    // Boss mode records the child's first try at each question, for skill mastery
    const sessionIdRef = useRef<string | null>(null);
    const recordedRef = useRef<Set<string>>(new Set());
    const questionShownAtRef = useRef(Date.now());

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

    /* Boss mode: load the node from the map */
    useEffect(() => {
        if (!student) return;
        const id = getNodeIdFromUrl();
        if (!id) return;
        setNodeId(id);
        loadWorld(student.id)
            .then((world) => {
                const found = findNode(world, id);
                if (!found || found.type !== "boss" || !found.unlocked) {
                    router.push("/play");
                    return;
                }
                setBoss(found);
                setTopic(found.topic);
            })
            .catch((err) => setError(getErrorMessage(err)));
    }, [student, router]);

    /* Boss mode: the computer pulls the rope every few seconds */
    useEffect(() => {
        if (!boss || step !== "play" || gameOver) return;
        const delay = BOSS_PULL_MS[boss.gradeLevel] * (0.8 + Math.random() * 0.4);
        const id = setTimeout(() => setScoreP2((s) => s + 1), delay);
        return () => clearTimeout(id);
    }, [boss, step, gameOver, scoreP2]);

    /* Elapsed timer */
    useEffect(() => {
        if (step !== "play" || gameOver) return;
        const id = setInterval(() => setTimer((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, [step, gameOver]);

    /* Battle play: start background music; leave play: stop it */
    useEffect(() => {
        if (step === "play") {
            startBackgroundMusic();
            return () => stopBackgroundMusic();
        }
        if (step === "result" || step === "setup") {
            stopBackgroundMusic();
        }
    }, [step]);

    /* Start battle — fetch questions and split between teams */
    const startBattle = useCallback(async () => {
        if (!student || !topic) return;
        setLoading(true);
        setError("");
        const gradeLevel = boss?.gradeLevel ?? student.gradeLevel;
        try {
            let qs: Question[];
            let sessionId: string | null = null;
            try {
                const res = await practiceApi.start({
                    studentId: student.id,
                    topic,
                    gradeLevel,
                    skillId: boss?.skillId,
                });
                qs = res.questions;
                sessionId = res.sessionId;
                cacheQuestions(qs, topic, gradeLevel);
            } catch (err: any) {
                // No connection: battle with questions saved on the phone; the map
                // sends the boss result and these answers later
                if (err?.response) throw err;
                qs = pickCachedQuestions(topic, gradeLevel, 20);
                if (qs.length < 6) throw err;
                if (boss) sessionId = startOfflineSession(student.id, topic, gradeLevel);
            }
            sessionIdRef.current = sessionId;
            recordedRef.current = new Set();
            questionShownAtRef.current = Date.now();
            if (qs.length < 6) {
                setError("Not enough questions. Try another topic.");
                return;
            }
            if (boss) {
                // Only the child answers questions; the boss is the computer
                setQuestionsP1(qs);
                setQuestionsP2([]);
            } else {
                setQuestionsP1(qs.filter((_, i) => i % 2 === 0));
                setQuestionsP2(qs.filter((_, i) => i % 2 === 1));
            }
            setAttemptsP1(0);
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
    }, [student, topic, boss]);

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
            if (player === 1) setAttemptsP1((a) => a + 1);

            const sessionId = sessionIdRef.current;
            if (boss && player === 1 && sessionId && !recordedRef.current.has(q.id)) {
                recordedRef.current.add(q.id);
                const timeSpent = Math.max(1, Math.round((Date.now() - questionShownAtRef.current) / 1000));
                if (sessionId.startsWith("offline-")) {
                    recordOfflineAnswer(sessionId, { questionId: q.id, answer: value, timeSpent });
                } else {
                    // Fire and forget: the tug of war never waits on the network
                    practiceApi
                        .submitAnswer({ sessionId, questionId: q.id, answer: value, timeSpent })
                        .catch(() => {});
                }
            }

            if (value === q.correctAnswer) {
                try { playCorrectSFX(); } catch {}
                setFlash("correct");
                setScore((prev) => prev + 1);
                setTimeout(() => {
                    setFlash(null);
                    setAnswer("");
                    setIndex((prev) => prev + 1);
                    if (player === 1) questionShownAtRef.current = Date.now();
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
            boss,
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
            if (boss) {
                setWinBanner(w === 1 ? `${student?.name} beat ${boss.title}!` : `${boss.title} pulled you over!`);
            } else {
                setWinBanner(w === 1 ? "Team 1 pulled them over!" : "Team 2 pulled them over!");
            }
            try { playVictorySFX(); } catch {}
            setTimeout(() => {
                setWinner(w);
                setStep("result");
            }, 2000);
        }
    }, [scoreP1, scoreP2, step, gameOver, boss, student]);

    /* ─── Loading guard ─── */
    if (!student) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="font-display text-2xl font-semibold text-ink-muted">Loading...</p>
            </div>
        );
    }

    /* ═══════════════════════════
       BOSS INTRO (map node)
       ═══════════════════════════ */
    if (step === "setup" && nodeId) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-6 max-w-2xl">
                    <GameTopBar onBack={() => router.push("/play")} />
                    {error && (
                        <div className="mb-6 rounded-2xl bg-danger/10 p-4 ring-1 ring-danger/30">
                            <p className="text-center font-semibold text-danger-dark">{error}</p>
                        </div>
                    )}
                    {boss ? (
                        <div className="card relative isolate mx-auto mb-6 max-w-md overflow-hidden text-center !p-7 sm:!p-9">
                            <p className="mb-1 font-display text-sm font-semibold uppercase tracking-widest text-danger-dark">
                                Boss battle
                            </p>
                            <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-secondary text-7xl ring-4 ring-white">
                                <span className="animate-float">{boss.emoji}</span>
                            </div>
                            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{boss.title}</h1>
                            <p className="mt-2 text-lg text-ink-soft">
                                Answer quickly to pull the rope, {student.name}!
                            </p>
                            <p className="mt-1 text-base text-ink-muted">
                                Get {WIN_LEAD} pulls ahead before {boss.title} does to win.
                            </p>
                        </div>
                    ) : (
                        !error && (
                            <p className="py-12 text-center font-display text-2xl font-semibold text-ink-muted">
                                Getting ready...
                            </p>
                        )
                    )}
                    <div className="mx-auto flex max-w-md flex-col gap-3">
                        <Button variant="danger" fullWidth onClick={startBattle} disabled={!boss || loading}>
                            {loading ? "Loading..." : "⚔️ Start battle"}
                        </Button>
                        <Button variant="neutral" fullWidth onClick={() => router.push("/play")}>
                            Back to map
                        </Button>
                    </div>
                </div>
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
                <div className="container mx-auto px-4 py-6 max-w-2xl">
                    <GameTopBar onBack={() => router.push("/dashboard")} />

                    <div className="text-center mb-6">
                        <h1 className="font-display text-4xl font-semibold text-ink mb-2">
                            ⚔️ Tug of War
                        </h1>
                        <p className="text-lg text-ink-soft">
                            Two teams pull the rope! Answer correctly to pull.
                            First team to drag the rope fully to their side wins!
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-2xl bg-danger/10 p-4 ring-1 ring-danger/30">
                            <p className="text-center font-semibold text-danger-dark">
                                {error}
                            </p>
                        </div>
                    )}

                    <Card colorful className="mb-6 !p-5 sm:!p-6">
                        <h2 className="mb-4 font-display text-2xl font-semibold text-ink">
                            Choose a topic
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {TOPICS.map((t) => {
                                const selected = topic === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => setTopic(t.id)}
                                        className={`relative flex min-h-[96px] flex-col items-start justify-center rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                                            selected
                                                ? "bg-primary/10 ring-[3px] ring-primary shadow-lift"
                                                : "bg-white ring-2 ring-ink/10 hover:ring-primary/40"
                                        }`}
                                    >
                                        <span className="text-4xl leading-none">{t.icon}</span>
                                        <span className="mt-2 font-display text-lg font-semibold text-ink">
                                            {t.label}
                                        </span>
                                        {selected && (
                                            <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                                                <CheckIcon size={14} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    <Button
                        variant="danger"
                        fullWidth
                        onClick={startBattle}
                        disabled={!topic || loading}
                    >
                        {loading ? "Loading..." : "⚔️ Start battle"}
                    </Button>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════
       RESULT SCREEN
       ═══════════════════════════ */
    if (step === "result") {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
                    {/* isolate: the celebration sits behind the text but above the card's white */}
                    <div className="card relative isolate mb-5 overflow-hidden !p-6 sm:!p-8">
                        {winner !== null && (!boss || winner === 1) && <RewardBurst className="-z-10" />}
                        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                            {boss ? (
                                winner === 1 ? `You beat ${boss.title}! 🎉` : `${boss.title} wins this time!`
                            ) : (
                                <>
                                    {winner === 1 && "Team 1 Wins! 🎉"}
                                    {winner === 2 && "Team 2 Wins! 🎉"}
                                    {winner === null && "It's a Tie! 🤝"}
                                </>
                            )}
                        </h2>
                        <p className="mt-2 font-display text-5xl font-semibold leading-none text-primary">
                            {scoreP1} – {scoreP2}
                        </p>
                        <p className="mt-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
                            Time {formatTime(timer)}
                        </p>
                    </div>

                    {/* The scene was drawn for a dark backdrop */}
                    <div className="mx-auto mb-6 max-w-lg rounded-4xl bg-night p-3 shadow-card ring-4 ring-white">
                        <TugOfWarScene
                            scoreP1={scoreP1}
                            scoreP2={scoreP2}
                        />
                    </div>

                    {boss ? (
                        <div className="card !p-6">
                            <NodeResult
                                studentId={student.id}
                                nodeId={boss.id}
                                correct={scoreP1}
                                total={attemptsP1}
                                won={winner === 1}
                                onPlayAgain={startBattle}
                            />
                        </div>
                    ) : (
                        <div className="mx-auto flex max-w-sm flex-col gap-3">
                            <Button
                                variant="success"
                                fullWidth
                                onClick={() => {
                                    setStep("setup");
                                    setTopic(null);
                                }}
                            >
                                Play again
                            </Button>
                            <Button
                                variant="neutral"
                                fullWidth
                                onClick={() => router.push("/dashboard")}
                            >
                                Free play
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ═══════════════════════════
       PLAY SCREEN  (3-column, full viewport)
       ═══════════════════════════ */
    return (
        // Boss battle on a phone stacks vertically and the page may scroll; everything
        // else (tablet and up, and two-player mode) fills the viewport as before
        <div
            className={`flex flex-col bg-night ${
                boss ? "min-h-screen sm:h-screen sm:overflow-hidden" : "min-h-screen h-screen overflow-hidden"
            }`}
        >
            {/* Top bar — full width */}
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex-shrink-0">
                <button
                    type="button"
                    aria-label="Back"
                    onClick={() => {
                        if (!confirm("Leave battle?")) return;
                        if (boss) router.push("/play");
                        else setStep("setup");
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary active:scale-95"
                >
                    <ChevronLeftIcon size={22} />
                </button>
                <h1 className="text-white font-display font-semibold text-base sm:text-lg md:text-xl lg:text-2xl tracking-wide text-center truncate mx-2">
                    Tug of War
                </h1>
                <span className="rounded-full bg-white px-3 py-1 font-display text-sm font-semibold text-primary whitespace-nowrap">
                    ⏱ {formatTime(timer)}
                </span>
            </div>

            {/* Win banner */}
            {winBanner && (
                <div className="text-center py-2 sm:py-3 px-4 flex-shrink-0 animate-pulse bg-secondary/20 border-y-2 border-secondary/50">
                    <p className="font-display text-secondary-light text-lg sm:text-xl md:text-2xl font-semibold">{winBanner}</p>
                </div>
            )}

            {/* Main area — fills remaining space, full width */}
            <div className={`flex-1 ${boss ? "sm:min-h-0" : "min-h-0"} w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-4 flex flex-col`}>
                <div
                    className={`grid ${
                        // Phone boss layout: slim boss strip, scene, then the keypad takes the spare height
                        boss
                            ? "grid-cols-1 grid-rows-[auto_auto_1fr] sm:grid-cols-[1fr_1.1fr_1fr] sm:grid-rows-none"
                            : "grid-cols-[1fr_1.1fr_1fr]"
                    } lg:grid-cols-[1fr_1.3fr_1fr] gap-3 sm:gap-4 md:gap-6 flex-1 ${
                        boss ? "sm:min-h-0" : "min-h-0"
                    } items-stretch max-w-[1920px] mx-auto w-full`}
                >
                    {/* ── Team 1 panel ── (last on a phone in boss mode, so the keypad sits under the thumb) */}
                    <TeamPanel
                        stacked={!!boss}
                        className={boss ? "order-3 sm:order-none" : ""}
                        team={1}
                        label={boss ? student.name : undefined}
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
                    <div className={`flex flex-col items-center justify-center min-h-0 flex-1 ${boss ? "order-2 sm:order-none" : ""}`}>
                        {/* Scoreboard */}
                        <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2 flex-shrink-0">
                            <span className="text-primary-light font-display font-semibold text-sm sm:text-base md:text-lg">
                                {boss ? student.name : "Team 1"}
                            </span>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-white font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold">
                                    {scoreP1}
                                </span>
                                <span className="text-white text-lg sm:text-xl">–</span>
                                <span className="text-white font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold">
                                    {scoreP2}
                                </span>
                            </div>
                            <span className="text-danger-light font-display font-semibold text-sm sm:text-base md:text-lg">
                                {boss ? "Boss" : "Team 2"}
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

                    {/* ── Team 2 panel (or the computer boss) ── */}
                    {boss ? (
                        <BossPanel boss={boss} score={scoreP2} gameOver={gameOver} className="order-1 sm:order-none" />
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
}
