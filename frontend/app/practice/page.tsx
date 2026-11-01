"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { CheckIcon, ChevronLeftIcon, HeartIcon, StarIcon } from "@/components/ui/Icons";
import { practiceApi, getErrorMessage } from "@/lib/api";
import NodeResult from "@/components/world/NodeResult";
import RewardBurst from "@/components/world/RewardBurst";
import { findNode, getNodeIdFromUrl, loadWorld } from "@/lib/world";
import { cacheQuestions, pickCachedQuestions } from "@/lib/questionCache";
import { flushOfflineSessions, recordOfflineAnswer, startOfflineSession } from "@/lib/offlineAnswers";
import RiverGameCanvas, { RiverGameHandle } from "./RiverGameCanvas";
import FunBreak from "./FunBreak";
import { trackEvent } from "@/lib/events";
import {
    playCorrectSFX,
    playWrongSFX,
    playGameOverSFX,
    playVictorySFX,
    playSplashSFX,
    isSoundOff,
    setSoundOff,
    startTenseMusic,
    stopTenseMusic,
} from "./GameAudio";
import type {
    AnswerSubmitResponse,
    PracticeCompleteResponse,
    Question,
    Student,
    Topic,
    AvatarType,
    GradeLevel,
    WorldNode,
} from "@/lib/types";

// The croc is faster for older children: think fast! Long word problems get
// extra reading time so slow readers are not punished for reading.
function questionTimeFor(grade: GradeLevel | undefined, text: string): number {
    const base = grade === "KG1" || grade === "KG2" ? 30 : 20;
    const words = text.trim().split(/\s+/).length;
    return base + Math.min(15, Math.round(Math.max(0, words - 6) * 0.7));
}
// Right with this many seconds (or fewer) left: "Phew, just in time!"
const CLOSE_CALL_SECONDS = 3;
const QUESTIONS_PER_SESSION = 10;
const MAX_LIVES = 3;
// A short no-maths tapping break after this many questions
const FUN_BREAK_EVERY = 5;

const topics: Array<{ id: Topic; label: string; icon: string; grades: string }> = [
    { id: "counting", label: "Counting", icon: "🔢", grades: "KG1-KG2" },
    { id: "addition", label: "Addition", icon: "➕", grades: "KG2-P3" },
    { id: "subtraction", label: "Subtraction", icon: "➖", grades: "KG2-P3" },
    { id: "multiplication", label: "Multiplication", icon: "✖️", grades: "P2-P3" },
];

type Step = "topic" | "game" | "results";

type PendingAnswer = {
    sessionId: string;
    questionId: string;
    answer: number;
    timeSpent: number;
};

type PendingCompletion = {
    sessionId: string;
};

function getAvatarNickname(avatar: AvatarType): string {
    switch (avatar) {
        case "lion":
            return "Kojo the Lion";
        case "elephant":
            return "Ama the Elephant";
        case "cheetah":
            return "Yaw the Cheetah";
        case "monkey":
            return "Kofi the Monkey";
        case "eagle":
            return "Abena the Eagle";
        case "fish":
            return "Esi the Fish";
        default:
            return "Kojo the Lion";
    }
}

export default function PracticePage() {
    const router = useRouter();

    const [student, setStudent] = useState<Student | null>(null);
    const [step, setStep] = useState<Step>("topic");
    const [topic, setTopic] = useState<Topic | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [lives, setLives] = useState(MAX_LIVES);
    // Out of lives, holding the fisherman's rope: one last chance
    const [onRope, setOnRope] = useState(false);
    const [soundOff, setSoundOffState] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerSubmitResponse | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [totalTimeSpent, setTotalTimeSpent] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [offline, setOffline] = useState(false);
    const [results, setResults] = useState<PracticeCompleteResponse | null>(null);
    const [endedByLives, setEndedByLives] = useState(false);
    const [funBreak, setFunBreak] = useState(false);
    // Set when launched from the Adventure World map (?node=...)
    const [nodeId, setNodeId] = useState<string | null>(null);
    const [node, setNode] = useState<WorldNode | null>(null);

    const riverGameRef = useRef<RiverGameHandle | null>(null);
    const questionStartTimeRef = useRef<number>(Date.now());

    // Refs to track running totals (fixes stale closure in finalizeSession)
    const correctRef = useRef(0);
    const wrongRef = useRef(0);
    const timeRef = useRef(0);
    const streakRef = useRef(0);
    const livesRef = useRef(MAX_LIVES);
    const rescueUsedRef = useRef(false);
    const ropeRef = useRef(false);
    const gradeRef = useRef<GradeLevel | undefined>(undefined);
    const questionTimeRef = useRef(30);

    const currentQuestion = questions[currentIndex];

    const progressPercent = useMemo(() => {
        if (!questions.length) return 0;
        return Math.round(((currentIndex + 1) / questions.length) * 100);
    }, [currentIndex, questions.length]);

    useEffect(() => {
        const studentData = localStorage.getItem("selectedStudent");
        if (studentData) {
            setStudent(JSON.parse(studentData));
        } else {
            router.push("/student/select");
        }
    }, [router]);

    useEffect(() => setSoundOffState(isSoundOff()), []);

    const toggleSound = () => {
        const off = !soundOff;
        setSoundOff(off);
        setSoundOffState(off);
    };

    // Start/stop background music when game step changes
    useEffect(() => {
        if (step === "game") {
            startTenseMusic();
        } else {
            stopTenseMusic();
        }
        return () => stopTenseMusic();
    }, [step]);

    useEffect(() => {
        setOffline(!navigator.onLine);
        const handleOnline = () => {
            setOffline(false);
            flushPending();
            flushOfflineSessions();
        };
        const handleOffline = () => setOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        if (step !== "game") return;
        if (!currentQuestion) return;
        // The clock starts when the break ends
        if (funBreak) return;

        const questionTime = questionTimeFor(gradeRef.current, currentQuestion.questionText);
        questionTimeRef.current = questionTime;
        setTimeLeft(questionTime);
        riverGameRef.current?.setDanger(0);
        questionStartTimeRef.current = Date.now();
        if (currentIndex > 0 && currentIndex === questions.length - 1) {
            riverGameRef.current?.announce("🏝️ LAST STROKE! SWIM!", "#69f0ae");
        }

        const interval = setInterval(() => {
            const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
            riverGameRef.current?.setDanger(elapsed / questionTime);
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleAnswer(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [step, currentIndex, currentQuestion, funBreak]);

    // Map node: look up its topic and grade, then start straight away
    useEffect(() => {
        if (!student) return;
        const id = getNodeIdFromUrl();
        if (!id) return;
        setNodeId(id);
        loadWorld(student.id)
            .then((world) => {
                const found = findNode(world, id);
                if (!found || found.type !== "river" || !found.unlocked) {
                    router.push("/play");
                    return;
                }
                setNode(found);
                startPractice(found.topic, found.gradeLevel, found.skillId);
            })
            .catch((err) => setError(getErrorMessage(err)));
        // startPractice is recreated every render; run once per student
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student]);

    const flushPending = async () => {
        const pendingAnswersRaw = localStorage.getItem("pendingAnswers");
        const pendingCompletionsRaw = localStorage.getItem("pendingCompletions");

        const pendingAnswers: PendingAnswer[] = pendingAnswersRaw ? JSON.parse(pendingAnswersRaw) : [];
        const pendingCompletions: PendingCompletion[] = pendingCompletionsRaw
            ? JSON.parse(pendingCompletionsRaw)
            : [];

        if (!pendingAnswers.length && !pendingCompletions.length) return;

        try {
            for (const answer of pendingAnswers) {
                await practiceApi.submitAnswer(answer);
            }
            for (const completion of pendingCompletions) {
                await practiceApi.complete(completion);
            }
            localStorage.removeItem("pendingAnswers");
            localStorage.removeItem("pendingCompletions");
        } catch {
            // Keep pending if still failing
        }
    };

    const startPractice = async (selectedTopic: Topic, gradeOverride?: GradeLevel, skillId?: string) => {
        if (!student) return;
        const gradeLevel = gradeOverride ?? student.gradeLevel;
        setLoading(true);
        setError("");
        setTopic(selectedTopic);
        gradeRef.current = gradeLevel;
        livesRef.current = MAX_LIVES;
        rescueUsedRef.current = false;
        ropeRef.current = false;
        setLives(MAX_LIVES);
        setOnRope(false);

        // Reset refs
        correctRef.current = 0;
        wrongRef.current = 0;
        timeRef.current = 0;
        streakRef.current = 0;

        try {
            const response = await practiceApi.start({
                studentId: student.id,
                topic: selectedTopic,
                gradeLevel,
                skillId,
            });

            cacheQuestions(response.questions, selectedTopic, gradeLevel);

            setQuestions(response.questions.slice(0, QUESTIONS_PER_SESSION));
            setSessionId(response.sessionId);
            setStep("game");
            setCurrentIndex(0);
            setCorrectCount(0);
            setWrongCount(0);
            setTotalTimeSpent(0);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setResults(null);
            setEndedByLives(false);
            setFunBreak(false);
        } catch (err) {
            const cached = pickCachedQuestions(selectedTopic, gradeLevel, QUESTIONS_PER_SESSION);
            if (cached.length) {
                setOffline(true);
                setQuestions(cached);
                setSessionId(startOfflineSession(student.id, selectedTopic, gradeLevel));
                setStep("game");
                setCurrentIndex(0);
                setCorrectCount(0);
                setWrongCount(0);
                setTotalTimeSpent(0);
                setSelectedAnswer(null);
                setAnswerResult(null);
                setResults(null);
                setEndedByLives(false);
                setFunBreak(false);
            } else {
                setError(getErrorMessage(err));
            }
        } finally {
            setLoading(false);
        }
    };

    const queueAnswer = (payload: PendingAnswer) => {
        const pendingAnswersRaw = localStorage.getItem("pendingAnswers");
        const pendingAnswers: PendingAnswer[] = pendingAnswersRaw ? JSON.parse(pendingAnswersRaw) : [];
        pendingAnswers.push(payload);
        localStorage.setItem("pendingAnswers", JSON.stringify(pendingAnswers));
    };

    const queueCompletion = (payload: PendingCompletion) => {
        const pendingCompletionsRaw = localStorage.getItem("pendingCompletions");
        const pendingCompletions: PendingCompletion[] = pendingCompletionsRaw
            ? JSON.parse(pendingCompletionsRaw)
            : [];
        pendingCompletions.push(payload);
        localStorage.setItem("pendingCompletions", JSON.stringify(pendingCompletions));
    };

    const handleAnswer = async (answer: number | null) => {
        if (!currentQuestion || selectedAnswer !== null) return;

        const timeSpent = Math.max(
            1,
            Math.round((Date.now() - questionStartTimeRef.current) / 1000)
        );
        const chosen = answer ?? -1;
        const isWrong = chosen !== currentQuestion.correctAnswer;

        // Update refs immediately (never stale)
        if (!isWrong) {
            correctRef.current += 1;
            streakRef.current += 1;
        } else {
            wrongRef.current += 1;
            streakRef.current = 0;
        }
        timeRef.current += timeSpent;

        // Lives, with one rescue rope per session so a struggling child keeps
        // practising instead of being knocked out after three slips
        let livesAfter = livesRef.current;
        let rescue = false;
        if (isWrong) {
            if (ropeRef.current) {
                ropeRef.current = false;
                livesAfter = 0;
            } else {
                livesAfter = Math.max(0, livesAfter - 1);
                const moreLeft = currentIndex + 1 < questions.length;
                if (livesAfter === 0 && !rescueUsedRef.current && moreLeft) {
                    rescue = true;
                    rescueUsedRef.current = true;
                    ropeRef.current = true;
                }
            }
        } else if (ropeRef.current) {
            ropeRef.current = false;
            livesAfter = 1;
        }
        livesRef.current = livesAfter;
        setLives(livesAfter);
        setOnRope(ropeRef.current);

        setSelectedAnswer(chosen);
        setTotalTimeSpent(timeRef.current);

        const isGameOverByLives = livesAfter <= 0 && !ropeRef.current;
        const isLastQuestion = isGameOverByLives || currentIndex + 1 >= questions.length;
        const questionTime = questionTimeRef.current;

        // Swim stroke, or the croc lunges
        riverGameRef.current?.handleAnswerResult(!isWrong, {
            fast: timeSpent <= questionTime / 3,
            streak: streakRef.current >= 3 && streakRef.current % 3 === 0,
            close: !isWrong && timeSpent >= questionTime - CLOSE_CALL_SECONDS,
            livesLeft: livesAfter,
            isLast: isLastQuestion,
            rescue,
        });

        if (offline || !sessionId || sessionId.startsWith("offline-")) {
            const isCorrect = !isWrong;
            const result: AnswerSubmitResponse = {
                correct: isCorrect,
                correctAnswer: currentQuestion.correctAnswer,
                explanation: currentQuestion.explanation ?? undefined,
            };
            setAnswerResult(result);
            if (isCorrect) {
                setCorrectCount(correctRef.current);
                playCorrectSFX();
            } else {
                setWrongCount(wrongRef.current);
                playWrongSFX();
                playSplashSFX();
            }

            if (sessionId?.startsWith("offline-")) {
                // Played with no data: kept on the phone for the parent report
                recordOfflineAnswer(sessionId, { questionId: currentQuestion.id, answer: chosen, timeSpent });
            } else {
                queueAnswer({
                    sessionId: sessionId || "",
                    questionId: currentQuestion.id,
                    answer: chosen,
                    timeSpent,
                });
            }
        } else {
            try {
                const result = await practiceApi.submitAnswer({
                    sessionId,
                    questionId: currentQuestion.id,
                    answer: chosen,
                    timeSpent,
                });

                setAnswerResult(result);
                if (result.correct) {
                    setCorrectCount(correctRef.current);
                    playCorrectSFX();
                } else {
                    setWrongCount(wrongRef.current);
                    playWrongSFX();
                    playSplashSFX();
                }
            } catch {
                queueAnswer({
                    sessionId,
                    questionId: currentQuestion.id,
                    answer: chosen,
                    timeSpent,
                });
                const isCorrect = !isWrong;
                const result: AnswerSubmitResponse = {
                    correct: isCorrect,
                    correctAnswer: currentQuestion.correctAnswer,
                    explanation: currentQuestion.explanation ?? undefined,
                };
                setAnswerResult(result);
                if (isCorrect) {
                    setCorrectCount(correctRef.current);
                    playCorrectSFX();
                } else {
                    setWrongCount(wrongRef.current);
                    playWrongSFX();
                    playSplashSFX();
                }
            }
        }

        // The last answer gets time for the escape or the chomp to play out
        setTimeout(() => {
            if (isGameOverByLives) {
                finalizeSession(true);
            } else if (currentIndex + 1 < questions.length) {
                if ((currentIndex + 1) % FUN_BREAK_EVERY === 0) setFunBreak(true);
                setCurrentIndex((prev) => prev + 1);
                setSelectedAnswer(null);
                setAnswerResult(null);
            } else {
                finalizeSession(false);
            }
            // Slips stay on screen longer so the right answer can sink in
        }, isLastQuestion ? 2800 : isWrong ? 2600 : 1500);
    };

    const finalizeSession = async (endedBecauseOfLives: boolean) => {
        if (!sessionId) return;

        stopTenseMusic();
        setEndedByLives(endedBecauseOfLives);

        // Always use local refs for results (server values may lag behind)
        const finalCorrect = correctRef.current;
        const finalWrong = wrongRef.current;
        const finalTime = timeRef.current;
        const totalAnswered = finalCorrect + finalWrong;
        const summary = buildSummary(totalAnswered, finalCorrect, finalWrong, finalTime);
        setResults(summary);
        setStep("results");

        if (endedBecauseOfLives) playGameOverSFX(); else playVictorySFX();

        // Tell server session is done (fire-and-forget for tracking)
        if (!sessionId.startsWith("offline-") && !offline) {
            try {
                await practiceApi.complete({ sessionId });
            } catch {
                queueCompletion({ sessionId });
            }
        }
    };

    function buildSummary(
        total: number,
        correct: number,
        wrong: number,
        time: number
    ): PracticeCompleteResponse {
        const accuracy = total ? Math.round((correct / total) * 100) : 0;
        let stars = 10;
        if (accuracy >= 90) stars = 50;
        else if (accuracy >= 80) stars = 40;
        else if (accuracy >= 70) stars = 30;
        else if (accuracy >= 60) stars = 20;
        return {
            totalQuestions: total,
            correctAnswers: correct,
            wrongAnswers: wrong,
            totalTimeSpent: time,
            starsEarned: stars,
            accuracy,
        };
    }

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

            <div className="container mx-auto px-4 py-8">
                {step === "topic" && nodeId && (
                    <div className="max-w-xl mx-auto text-center py-12">
                        {error ? (
                            <>
                                <p className="text-danger font-bold text-xl mb-4">{error}</p>
                                <Button variant="primary" onClick={() => router.push("/play")}>
                                    🗺️ Back to Map
                                </Button>
                            </>
                        ) : (
                            <p className="text-2xl text-gray-600">
                                {node ? `${node.emoji} ${node.title}` : "Getting ready..."}
                            </p>
                        )}
                    </div>
                )}

                {step === "topic" && !nodeId && (
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-bold text-primary mb-2">
                                Choose a Practice Topic 🎯
                            </h2>
                            <p className="text-xl text-gray-600">
                                {student.name}, pick a topic to start practicing!
                            </p>
                            {offline && (
                                <p className="text-sm text-danger font-bold mt-2">
                                    You are offline. Cached questions will be used if available.
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-danger/10 border-4 border-danger rounded-2xl p-4 mb-6">
                                <p className="text-danger font-bold text-center">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {topics.map((t) => (
                                <Card
                                    key={t.id}
                                    colorful
                                    className="text-center p-8 hover:scale-105 transition-transform cursor-pointer"
                                    onClick={() => startPractice(t.id)}
                                >
                                    <div className="text-6xl mb-4">{t.icon}</div>
                                    <h3 className="text-2xl font-bold text-primary mb-2">
                                        {t.label}
                                    </h3>
                                    <p className="text-gray-600">Grades: {t.grades}</p>
                                    <Button
                                        variant="primary"
                                        className="mt-4"
                                        disabled={loading}
                                    >
                                        {loading && topic === t.id ? "Starting..." : "Start Practice"}
                                    </Button>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="text-primary font-bold text-lg hover:underline"
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {step === "game" && currentQuestion && (
                    <div className="max-w-3xl mx-auto">
                        {/* Game HUD: back, progress, lives */}
                        <div className="mb-3 flex items-center gap-3">
                            <button
                                type="button"
                                aria-label="Back"
                                onClick={() => {
                                    stopTenseMusic();
                                    if (nodeId) router.push("/play");
                                    else setStep("topic");
                                }}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink-soft shadow-lift ring-1 ring-ink/5 active:scale-95"
                            >
                                <ChevronLeftIcon size={24} />
                            </button>
                            <div
                                className="h-5 flex-1 overflow-hidden rounded-full bg-ink/10 ring-1 ring-ink/5"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(progressPercent)}
                            >
                                <div
                                    className="relative h-full rounded-full bg-gradient-to-b from-success-light to-success transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                >
                                    <span className="absolute inset-x-2 top-[3px] h-1 rounded-full bg-white/40" />
                                </div>
                            </div>
                            {onRope ? (
                                <span className="shrink-0 animate-pulse rounded-full bg-secondary/40 px-3 py-1 font-display text-sm font-semibold text-ink">
                                    🛶 Last chance!
                                </span>
                            ) : (
                                <div className="flex shrink-0 items-center gap-0.5" aria-label={`${lives} lives left`}>
                                    {Array.from({ length: MAX_LIVES }, (_, i) => (
                                        <HeartIcon key={i} size={28} filled={i < lives} />
                                    ))}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={toggleSound}
                                aria-label={soundOff ? "Turn sound on" : "Turn sound off"}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-lift ring-1 ring-ink/5 active:scale-95"
                            >
                                {soundOff ? "🔇" : "🔊"}
                            </button>
                        </div>

                        <div className="mb-3 flex items-center justify-between px-1 font-display text-sm font-semibold text-ink-muted">
                            <span>
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            <span className={`rounded-full px-3 py-1 ${timeLeft <= 5 ? "bg-danger/15 text-danger-dark" : "bg-ink/5"}`}>
                                {timeLeft}s
                            </span>
                        </div>

                        {offline && (
                            <div className="mb-3 rounded-2xl bg-secondary/25 px-4 py-2 text-center text-sm font-semibold text-ink-soft">
                                Playing offline. Your results will save when you&apos;re back online.
                            </div>
                        )}

                        <RiverGameCanvas
                            ref={riverGameRef}
                            totalQuestions={questions.length}
                            danger={!funBreak && selectedAnswer === null && timeLeft <= 5}
                        />

                        {funBreak ? (
                            <FunBreak
                                onDone={(result, caught) => {
                                    setFunBreak(false);
                                    trackEvent(student.id, "fun_break", { result, caught, nodeId });
                                }}
                            />
                        ) : (
                            <Card colorful className="text-center !p-5 sm:!p-7">
                                <p className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                                    🐊 Swim, {getAvatarNickname(student.avatar)}! The crocodile is coming!
                                </p>
                                <div className="mb-6 mt-2 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                                    {currentQuestion.questionText}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        currentQuestion.option1,
                                        currentQuestion.option2,
                                        currentQuestion.option3,
                                        currentQuestion.option4,
                                    ].map((option) => {
                                        const isSelected = selectedAnswer === option;
                                        const isCorrect = answerResult?.correctAnswer === option;
                                        const isWrong = isSelected && answerResult && !answerResult.correct;

                                        return (
                                            <Button
                                                key={option}
                                                variant={isCorrect ? "success" : isWrong ? "danger" : "neutral"}
                                                onClick={() => handleAnswer(option)}
                                                disabled={selectedAnswer !== null}
                                                // The right and wrong picks stay bright; every other key dims so the eye lands on the answer
                                                className={`!min-h-[84px] !text-3xl ${isSelected && !answerResult ? "animate-pulse" : ""} ${
                                                    isCorrect || isWrong ? "!opacity-100 ![filter:none]" : ""
                                                } ${isWrong ? "animate-shake" : ""} ${isCorrect ? "animate-pop" : ""}`}
                                            >
                                                {option}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <div className="mt-5 flex min-h-[3rem] items-center justify-center">
                                    {answerResult &&
                                        (answerResult.correct ? (
                                            <p className="animate-bounce-in inline-flex items-center gap-2 rounded-full bg-success/15 px-4 py-2 font-display text-lg font-semibold text-success-dark">
                                                <CheckIcon size={18} />
                                                Ayekoo! Correct!
                                            </p>
                                        ) : (
                                            <div className="animate-bounce-in">
                                                <p className="rounded-full bg-danger/10 px-4 py-2 font-display text-lg font-semibold text-danger-dark">
                                                    SNAP! The answer was {answerResult.correctAnswer}
                                                </p>
                                                {answerResult.explanation && (
                                                    <p className="mt-2 font-semibold text-ink-soft">{answerResult.explanation}</p>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </Card>
                        )}

                        <div className="mt-4 flex justify-center">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-display text-base font-semibold text-ink-soft shadow-lift ring-1 ring-ink/5">
                                🏝️ Shore in <span className="text-ink">{questions.length - currentIndex}</span>{" "}
                                {questions.length - currentIndex === 1 ? "stroke" : "strokes"}
                            </span>
                        </div>
                    </div>
                )}

                {step === "results" && results && (
                    <div className="max-w-3xl mx-auto">
                        {/* isolate: the celebration sits behind the text but above the card's white */}
                        <Card colorful className="relative isolate overflow-hidden text-center !p-6 sm:!p-8">
                            {!endedByLives && <RewardBurst className="-z-10" />}

                            {endedByLives ? (
                                <h2 className="mb-2 font-display text-4xl font-semibold text-danger-dark">
                                    🐊 CHOMP! The crocodile got your sandal!
                                </h2>
                            ) : (
                                <h2 className="mb-2 font-display text-4xl font-semibold text-ink">
                                    Great job, {student.name}!
                                </h2>
                            )}

                            <p className="font-display text-7xl font-semibold leading-none text-primary">
                                {results.accuracy}%
                            </p>
                            <p className="mb-4 mt-1 text-sm font-bold uppercase tracking-wider text-ink-muted">correct</p>

                            {endedByLives && (
                                <p className="mb-4 text-lg font-semibold text-danger-dark">
                                    {student.name} jumped back into the canoe, safe, after {results.correctAnswers} strokes.
                                    Every try makes you a stronger swimmer. Try again!
                                </p>
                            )}

                            {!endedByLives && results.accuracy >= 80 && (
                                <p className="mb-4 text-lg font-semibold text-success-dark">
                                    You out-swam the crocodile and reached the shore!
                                </p>
                            )}

                            {!endedByLives && results.accuracy < 80 && results.accuracy > 0 && (
                                <p className="mb-4 text-lg font-semibold text-primary">
                                    You escaped, but the crocodile got close! Keep practising to swim faster. 💪
                                </p>
                            )}

                            <div className="mb-6 grid grid-cols-3 divide-x divide-ink/10 overflow-hidden rounded-2xl bg-white/80 ring-1 ring-ink/10">
                                {[
                                    { label: "Strokes", value: results.correctAnswers },
                                    { label: "Snaps", value: results.wrongAnswers },
                                    { label: "Time", value: `${results.totalTimeSpent}s` },
                                ].map((stat) => (
                                    <div key={stat.label} className="px-2 py-3">
                                        <p className="font-display text-2xl font-semibold text-ink">{stat.value}</p>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {!node && (
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/25 px-4 py-2 font-display text-lg font-semibold text-ink">
                                    <StarIcon size={24} />+{results.starsEarned} stars
                                </div>
                            )}

                            {offline && (
                                <p className="mb-4 font-semibold text-ink-soft">
                                    Offline session saved. Results will sync when you&apos;re back online.
                                </p>
                            )}

                            {node ? (
                                <NodeResult
                                    key={sessionId ?? "offline"}
                                    studentId={student.id}
                                    nodeId={node.id}
                                    correct={results.correctAnswers}
                                    total={questions.length}
                                    onPlayAgain={() => startPractice(node.topic, node.gradeLevel, node.skillId)}
                                />
                            ) : (
                                <div className="flex gap-4 justify-center">
                                    <Button variant="primary" onClick={() => topic && startPractice(topic)}>
                                        🔄 Play Again
                                    </Button>
                                    <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                                        🏠 Dashboard
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
