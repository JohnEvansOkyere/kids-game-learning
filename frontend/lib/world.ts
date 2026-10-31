/**
 * Adventure World helpers shared by the map and the game pages
 */
import { worldApi } from "./api";
import type { GradeLevel, NodeCompleteRequest, World, WorldNode } from "./types";

const PENDING_KEY = "pendingNodeCompletions";

type PendingNodeCompletion = {
    studentId: string;
    nodeId: string;
    result: NodeCompleteRequest;
};

/** Node id a game page was launched with (?node=...), or null for free play */
export function getNodeIdFromUrl(): string | null {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("node");
}

/** Page that plays a node */
export function nodeHref(node: WorldNode): string {
    const routes: Record<WorldNode["type"], string> = {
        river: "/practice",
        catch: "/games/counting-catch",
        pop: "/games/number-pop",
        boss: "/battle",
    };
    return `${routes[node.type]}?node=${encodeURIComponent(node.id)}`;
}

export function findNode(world: World, nodeId: string): WorldNode | null {
    for (const zone of world.zones) {
        const node = zone.nodes.find((n) => n.id === nodeId);
        if (node) return node;
    }
    return null;
}

/**
 * The node the child should play next: the first unplayed node in their own grade's zone
 * or a later one. Easier zones stay open for extra coins but are only suggested once
 * nothing is left from the home zone onward.
 */
export function findCurrentNode(world: World, gradeLevel: GradeLevel): WorldNode | null {
    const homeIndex = Math.max(0, world.zones.findIndex((z) => z.gradeLevel === gradeLevel));
    const isNext = (n: WorldNode) => n.unlocked && n.stars === 0;
    const fromHome = world.zones.slice(homeIndex).flatMap((z) => z.nodes);
    const easier = world.zones.slice(0, homeIndex).flatMap((z) => z.nodes);
    return fromHome.find(isNext) ?? easier.find(isNext) ?? null;
}

/** First unlocked node after this one in map order, crossing into the next zone */
export function findNextNode(world: World, nodeId: string): WorldNode | null {
    const nodes = world.zones.flatMap((zone) => zone.nodes);
    const index = nodes.findIndex((n) => n.id === nodeId);
    if (index === -1) return null;
    return nodes.slice(index + 1).find((n) => n.unlocked) ?? null;
}

function cacheKey(studentId: string) {
    return `world_${studentId}`;
}

/** Load the world, falling back to the last copy when offline */
export async function loadWorld(studentId: string): Promise<World> {
    try {
        const world = await worldApi.get(studentId);
        localStorage.setItem(cacheKey(studentId), JSON.stringify(world));
        return world;
    } catch (err) {
        const cached = localStorage.getItem(cacheKey(studentId));
        if (cached) return JSON.parse(cached) as World;
        throw err;
    }
}

/** Remember a node result that could not be sent, to retry from the map */
export function queueNodeCompletion(item: PendingNodeCompletion) {
    const raw = localStorage.getItem(PENDING_KEY);
    const pending: PendingNodeCompletion[] = raw ? JSON.parse(raw) : [];
    pending.push(item);
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export async function flushNodeCompletions() {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const pending: PendingNodeCompletion[] = JSON.parse(raw);
    const stillPending: PendingNodeCompletion[] = [];

    for (const item of pending) {
        try {
            await worldApi.completeNode(item.studentId, item.nodeId, item.result);
        } catch (err: any) {
            // Keep only network failures; a 4xx means the server will never accept it
            if (!err?.response) stillPending.push(item);
        }
    }

    if (stillPending.length) {
        localStorage.setItem(PENDING_KEY, JSON.stringify(stillPending));
    } else {
        localStorage.removeItem(PENDING_KEY);
    }
}

export function starString(stars: number, max = 3) {
    return "⭐".repeat(stars) + "☆".repeat(Math.max(0, max - stars));
}
