/**
 * Analytics events for the playtest retention metrics
 *
 * Events are queued in localStorage and sent in batches, so play while offline
 * still counts. Each event has a device-made id; the server ignores repeats.
 */
import { eventsApi } from "./api";
import type { AnalyticsEvent, AnalyticsEventName } from "./types";

const QUEUE_KEY = "pendingEvents";
// Keep the newest events if a phone stays offline for a very long time
const MAX_QUEUE = 500;
const BATCH_SIZE = 100;

type QueuedEvent = AnalyticsEvent & { studentId: string };

function readQueue(): QueuedEvent[] {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeQueue(queue: QueuedEvent[]) {
    try {
        if (queue.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
        else localStorage.removeItem(QUEUE_KEY);
    } catch {
        // storage full or blocked - analytics are optional
    }
}

// crypto.randomUUID needs https, and playtest phones may use plain http on the LAN
function newEventId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function trackEvent(studentId: string, name: AnalyticsEventName, props?: Record<string, unknown>) {
    const event: QueuedEvent = { studentId, id: newEventId(), name, occurredAt: new Date().toISOString() };
    if (props) event.props = props;
    writeQueue([...readQueue(), event]);
    void flushEvents();
}

let flushing = false;

/** Send one batch; true if it is finished with (sent or rejected), false to retry later */
async function sendBatch(studentId: string, batch: QueuedEvent[]): Promise<boolean> {
    try {
        await eventsApi.record(
            studentId,
            batch.map(({ studentId: _owner, ...event }) => event)
        );
        return true;
    } catch (err: any) {
        const status: number | undefined = err?.response?.status;
        // Offline or server trouble: keep for later. Rejected (4xx): the server will never take it.
        return Boolean(status && status < 500);
    }
}

export async function flushEvents() {
    if (flushing || typeof window === "undefined") return;
    flushing = true;
    const finished = new Set<string>();
    try {
        const queue = readQueue();
        for (const studentId of Array.from(new Set(queue.map((e) => e.studentId)))) {
            const events = queue.filter((e) => e.studentId === studentId);
            for (let i = 0; i < events.length; i += BATCH_SIZE) {
                const batch = events.slice(i, i + BATCH_SIZE);
                if (!(await sendBatch(studentId, batch))) return;
                batch.forEach((e) => finished.add(e.id));
            }
        }
    } finally {
        // Re-read so events tracked while sending are kept
        if (finished.size) writeQueue(readQueue().filter((e) => !finished.has(e.id)));
        flushing = false;
    }
}
