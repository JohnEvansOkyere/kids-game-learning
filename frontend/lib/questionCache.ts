/**
 * Questions kept on the device so river and boss stages work without data
 *
 * Filled whenever practice starts online and from the map's offline pack.
 * Keyed by topic + grade (each skill is one topic + grade for now).
 */
import type { Question } from "./types";

// Most recent questions kept per topic + grade
const MAX_CACHED = 50;

function cacheKey(topic: string, gradeLevel: string) {
    return `practice_cache_${topic}_${gradeLevel}`;
}

export function loadCachedQuestions(topic: string, gradeLevel: string): Question[] {
    try {
        const raw = localStorage.getItem(cacheKey(topic, gradeLevel));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.questions) ? parsed.questions : [];
    } catch {
        return [];
    }
}

/** Merge new questions in front of the cached ones, dropping duplicates */
export function cacheQuestions(questions: Question[], topic: string, gradeLevel: string) {
    const merged: Question[] = [];
    const seen = new Set<string>();
    for (const q of [...questions, ...loadCachedQuestions(topic, gradeLevel)]) {
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        merged.push(q);
    }
    try {
        localStorage.setItem(
            cacheKey(topic, gradeLevel),
            JSON.stringify({ savedAt: Date.now(), questions: merged.slice(0, MAX_CACHED) })
        );
    } catch {
        // storage full - the game still works online
    }
}

/** A random selection of cached questions, for playing offline */
export function pickCachedQuestions(topic: string, gradeLevel: string, count: number): Question[] {
    const cached = loadCachedQuestions(topic, gradeLevel).slice();
    for (let i = cached.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cached[i], cached[j]] = [cached[j], cached[i]];
    }
    return cached.slice(0, count);
}
