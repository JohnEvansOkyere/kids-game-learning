/**
 * Answers given while offline, kept on the device and sent when back online
 *
 * Each offline session gets an id made here; the server uses it so a session
 * sent twice (or sent again with more answers) is only saved once.
 */
import { practiceApi } from "./api";
import type { OfflineSessionAnswer } from "./types";

const QUEUE_KEY = "pendingOfflineSessions";
// An empty session is kept this long, in case the child is still answering
const EMPTY_SESSION_TTL_MS = 60 * 60 * 1000;

type OfflineSession = {
    clientSessionId: string;
    studentId: string;
    topic: string;
    gradeLevel: string;
    startedAt: string;
    updatedAt: number;
    answers: OfflineSessionAnswer[];
};

function readQueue(): OfflineSession[] {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeQueue(queue: OfflineSession[]) {
    try {
        if (queue.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        else localStorage.removeItem(QUEUE_KEY);
    } catch {
        // storage full or blocked - these answers just won't reach the parent report
    }
}

/** Start a session played without data; returns its id (always starts with "offline-") */
export function startOfflineSession(studentId: string, topic: string, gradeLevel: string): string {
    const clientSessionId = `offline-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    writeQueue([
        ...readQueue(),
        {
            clientSessionId,
            studentId,
            topic,
            gradeLevel,
            startedAt: new Date().toISOString(),
            updatedAt: Date.now(),
            answers: [],
        },
    ]);
    return clientSessionId;
}

export function recordOfflineAnswer(
    clientSessionId: string,
    answer: { questionId: string; answer: number; timeSpent: number }
) {
    const queue = readQueue();
    const session = queue.find((s) => s.clientSessionId === clientSessionId);
    if (!session) return;
    session.answers.push({ ...answer, answeredAt: new Date().toISOString() });
    session.updatedAt = Date.now();
    writeQueue(queue);
}

let flushing = false;

export async function flushOfflineSessions() {
    if (flushing || typeof window === "undefined") return;
    flushing = true;
    // questionIds the server has, per session
    const sent = new Map<string, Set<string>>();
    try {
        for (const session of readQueue()) {
            if (!session.answers.length) continue;
            try {
                await practiceApi.saveOfflineSession({
                    clientSessionId: session.clientSessionId,
                    studentId: session.studentId,
                    topic: session.topic,
                    gradeLevel: session.gradeLevel,
                    startedAt: session.startedAt,
                    answers: session.answers.slice(0, 50),
                });
            } catch (err: any) {
                const status: number | undefined = err?.response?.status;
                // Offline or server trouble: try again later. Rejected (4xx): drop it.
                if (!status || status >= 500) return;
            }
            sent.set(session.clientSessionId, new Set(session.answers.slice(0, 50).map((a) => a.questionId)));
        }
    } finally {
        // Re-read so answers given while sending are kept
        const now = Date.now();
        writeQueue(
            readQueue()
                .map((s) => {
                    const done = sent.get(s.clientSessionId);
                    return done ? { ...s, answers: s.answers.filter((a) => !done.has(a.questionId)) } : s;
                })
                .filter((s) => s.answers.length > 0 || now - s.updatedAt < EMPTY_SESSION_TTL_MS)
        );
        flushing = false;
    }
}
