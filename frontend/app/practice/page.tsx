"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { practiceApi, getErrorMessage } from "@/lib/api";
import type {
    AnswerSubmitResponse,
    PracticeCompleteResponse,
    Question,
    Student,
    Topic,
} from "@/lib/types";

const QUESTION_TIME_SECONDS = 30;
const QUESTIONS_PER_SESSION = 10;

const topics: Array<{ id: Topic; label: string; icon: string; grades: string }> = [
    { id: "counting", label: "Counting", icon: "🔢", grades: "KG1-KG2" },
    { id: "addition", label: "Addition", icon: "➕", grades: "KG2-P3" },
    { id: "subtraction", label: "Subtraction", icon: "➖", grades: "KG2-P3" },
    { id: "multiplication", label: "Multiplication", icon: "✖️", grades: "P2-P3" },
];

function playTone(frequency: number, durationMs: number) {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.1;

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            context.close();
        }, durationMs);
    } catch {
        // Audio is optional; ignore failures
    }
}

function getCacheKey(topic: Topic, gradeLevel: string) {
    return `practice_cache_${topic}_${gradeLevel}`;
}

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

export default function PracticePage() {
    const router = useRouter();

    const [student, setStudent] = useState<Student | null>(null);
    const [step, setStep] = useState<Step>("topic");
    const [topic, setTopic] = useState<Topic | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerSubmitResponse | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [totalTimeSpent, setTotalTimeSpent] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [offline, setOffline] = useState(false);
    const [results, setResults] = useState<PracticeCompleteResponse | null>(null);

    const questionStartTimeRef = useRef<number>(Date.now());

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

    useEffect(() => {
        setOffline(!navigator.onLine);
        const handleOnline = () => {
            setOffline(false);
            flushPending();
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

        setTimeLeft(QUESTION_TIME_SECONDS);
        questionStartTimeRef.current = Date.now();

        const interval = setInterval(() => {
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
    }, [step, currentIndex, currentQuestion]);

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

    const cacheQuestions = (newQuestions: Question[], selectedTopic: Topic, gradeLevel: string) => {
        const cacheKey = getCacheKey(selectedTopic, gradeLevel);
        const existing = localStorage.getItem(cacheKey);
        const existingQuestions: Question[] = existing ? JSON.parse(existing).questions || [] : [];
        const merged = [...newQuestions, ...existingQuestions].reduce<Question[]>((acc, q) => {
            if (!acc.find((item) => item.id === q.id)) acc.push(q);
            return acc;
        }, []);

        localStorage.setItem(
            cacheKey,
            JSON.stringify({
                savedAt: Date.now(),
                questions: merged.slice(0, 50),
            })
        );
    };

    const loadCachedQuestions = (selectedTopic: Topic, gradeLevel: string): Question[] => {
        const cacheKey = getCacheKey(selectedTopic, gradeLevel);
        const existing = localStorage.getItem(cacheKey);
        if (!existing) return [];
        const parsed = JSON.parse(existing);
        return Array.isArray(parsed.questions) ? parsed.questions : [];
    };

    const startPractice = async (selectedTopic: Topic) => {
        if (!student) return;
        setLoading(true);
        setError("");
        setTopic(selectedTopic);

        try {
            const response = await practiceApi.start({
                studentId: student.id,
                topic: selectedTopic,
                gradeLevel: student.gradeLevel,
            });

            cacheQuestions(response.questions, selectedTopic, student.gradeLevel);

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
        } catch (err) {
            const cached = loadCachedQuestions(selectedTopic, student.gradeLevel);
            if (cached.length) {
                setOffline(true);
                setQuestions(cached.slice(0, QUESTIONS_PER_SESSION));
                setSessionId(`offline-${Date.now()}`);
                setStep("game");
                setCurrentIndex(0);
                setCorrectCount(0);
                setWrongCount(0);
                setTotalTimeSpent(0);
                setSelectedAnswer(null);
                setAnswerResult(null);
                setResults(null);
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

        const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
        const chosen = answer ?? -1;
        setSelectedAnswer(chosen);
        setTotalTimeSpent((prev) => prev + timeSpent);

        if (offline || !sessionId || sessionId.startsWith("offline-")) {
            const isCorrect = chosen === currentQuestion.correctAnswer;
            const result: AnswerSubmitResponse = {
                correct: isCorrect,
                correctAnswer: currentQuestion.correctAnswer,
                explanation: currentQuestion.explanation ?? undefined,
            };
            setAnswerResult(result);
            if (isCorrect) {
                setCorrectCount((prev) => prev + 1);
                playTone(880, 200);
            } else {
                setWrongCount((prev) => prev + 1);
                playTone(220, 200);
            }

            if (!sessionId?.startsWith("offline-")) {
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
                    setCorrectCount((prev) => prev + 1);
                    playTone(880, 200);
                } else {
                    setWrongCount((prev) => prev + 1);
                    playTone(220, 200);
                }
            } catch {
                queueAnswer({
                    sessionId,
                    questionId: currentQuestion.id,
                    answer: chosen,
                    timeSpent,
                });
                const isCorrect = chosen === currentQuestion.correctAnswer;
                const result: AnswerSubmitResponse = {
                    correct: isCorrect,
                    correctAnswer: currentQuestion.correctAnswer,
                    explanation: currentQuestion.explanation ?? undefined,
                };
                setAnswerResult(result);
                if (isCorrect) {
                    setCorrectCount((prev) => prev + 1);
                    playTone(880, 200);
                } else {
                    setWrongCount((prev) => prev + 1);
                    playTone(220, 200);
                }
            }
        }

        setTimeout(() => {
            if (currentIndex + 1 < questions.length) {
                setCurrentIndex((prev) => prev + 1);
                setSelectedAnswer(null);
                setAnswerResult(null);
            } else {
                finalizeSession();
            }
        }, 1500);
    };

    const finalizeSession = async () => {
        if (!sessionId) return;

        if (sessionId.startsWith("offline-") || offline) {
            const summary: PracticeCompleteResponse = {
                totalQuestions: questions.length,
                correctAnswers: correctCount,
                wrongAnswers: wrongCount,
                totalTimeSpent,
                starsEarned: Math.max(10, Math.round((correctCount / questions.length) * 50)),
                accuracy: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
            };
            setResults(summary);
            setStep("results");
            playTone(660, 400);
            return;
        }

        try {
            const completion = await practiceApi.complete({ sessionId });
            setResults(completion);
        } catch {
            queueCompletion({ sessionId });
            const summary: PracticeCompleteResponse = {
                totalQuestions: questions.length,
                correctAnswers: correctCount,
                wrongAnswers: wrongCount,
                totalTimeSpent,
                starsEarned: Math.max(10, Math.round((correctCount / questions.length) * 50)),
                accuracy: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
            };
            setResults(summary);
        } finally {
            setStep("results");
            playTone(660, 400);
        }
    };

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
                {step === "topic" && (
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
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setStep("topic")}
                                className="text-primary font-bold hover:underline"
                            >
                                ← Back
                            </button>
                            <div className="text-lg font-bold">
                                Question {currentIndex + 1}/{questions.length}
                            </div>
                            <div className="text-lg font-bold">⏱️ {timeLeft}s</div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                            <div
                                className="bg-primary h-4 rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {offline && (
                            <div className="text-center text-danger font-bold mb-4">
                                Playing Offline — results will sync when online
                            </div>
                        )}

                        <Card colorful className="text-center p-8">
                            <div className="text-2xl font-bold text-primary mb-2">
                                ⭐⭐⭐ {student.name}'s Practice ⭐⭐⭐
                            </div>
                            <div className="text-3xl font-bold text-gray-800 mb-6">
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
                                            variant={isCorrect ? "success" : isWrong ? "danger" : "secondary"}
                                            onClick={() => handleAnswer(option)}
                                            disabled={selectedAnswer !== null}
                                            className={`${isSelected ? "animate-pulse" : ""}`}
                                        >
                                            {option}
                                        </Button>
                                    );
                                })}
                            </div>

                            {answerResult && (
                                <div className="mt-6 text-lg font-bold">
                                    {answerResult.correct ? (
                                        <p className="text-success">Ayekoo! Correct ✅</p>
                                    ) : (
                                        <p className="text-danger">
                                            Oops! Correct answer: {answerResult.correctAnswer}
                                        </p>
                                    )}
                                </div>
                            )}
                        </Card>

                        <div className="flex items-center justify-between mt-6 text-lg font-bold">
                            <div>Correct: {correctCount} ✓</div>
                            <div>Wrong: {wrongCount} ✗</div>
                        </div>
                    </div>
                )}

                {step === "results" && results && (
                    <div className="max-w-3xl mx-auto">
                        <Card colorful className="text-center p-8">
                            <h2 className="text-4xl font-bold text-primary mb-4">
                                🎉 Great Job {student.name}! 🎉
                            </h2>
                            <p className="text-2xl font-bold mb-4">
                                ⭐ {results.accuracy}% Score ⭐
                            </p>

                            <div className="text-lg text-gray-700 mb-6">
                                <p>✓ Correct: {results.correctAnswers}/{results.totalQuestions}</p>
                                <p>✗ Wrong: {results.wrongAnswers}/{results.totalQuestions}</p>
                                <p>⏱️ Total Time: {results.totalTimeSpent}s</p>
                            </div>

                            <div className="text-xl font-bold text-primary mb-6">
                                🏆 Rewards Earned: +{results.starsEarned} Stars ⭐
                            </div>

                            {offline && (
                                <p className="text-danger font-bold mb-4">
                                    Offline session saved. Results will sync when online.
                                </p>
                            )}

                            <div className="flex gap-4 justify-center">
                                <Button variant="primary" onClick={() => topic && startPractice(topic)}>
                                    Play Again
                                </Button>
                                <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                                    Dashboard
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
