"use client";

/**
 * ZoneScene - one zone of the Adventure World as a painted landscape
 *
 * A winding road runs through the stage nodes; stars arc over each node, the
 * stage the child should play next pulses with a START bubble, and the boss
 * sits at the end. Flat blue sky, white road, yellow for progress and rewards.
 */
import React from "react";
import { CheckIcon, LockIcon, StarIcon } from "@/components/ui/Icons";
import type { WorldNode, WorldZone } from "@/lib/types";

// The road is drawn in a fixed 360-wide space and scales with the screen
const W = 360;
const ROW = 132;
const PAD_TOP = 112; // room for the START bubble above the first stage
const PAD_BOTTOM = 124; // room for the last label and the hills
const XS = [180, 108, 252, 120, 244]; // where the road bends; the boss is always centred

type Scene = {
    sky: [string, string];
    hill: [string, string];
    road: string;
    edge: string;
    ink: string;
};

// Every zone shares one look: flat blue sky, white road and hills, navy text.
// Zones are told apart by their name and emoji, not by a different colour scheme.
const FLAT: Scene = { sky: ["#1D4ED8", "#1D4ED8"], hill: ["#FFFFFF", "#FFFFFF"], road: "#FFFFFF", edge: "#FFFFFF", ink: "#102A6B" };
const SCENES: Record<string, Scene> = {
    village: FLAT,
    farm: FLAT,
    market: FLAT,
    forest: FLAT,
    coast: FLAT,
};

type Point = { x: number; y: number };

function layout(nodes: WorldNode[]): { points: Point[]; height: number } {
    const points = nodes.map((n, i) => ({
        x: n.type === "boss" ? W / 2 : XS[i % XS.length],
        y: PAD_TOP + i * ROW,
    }));
    return { points, height: PAD_TOP + (nodes.length - 1) * ROW + PAD_BOTTOM };
}

/** A gentle S-curve between two stages */
function curve(a: Point, b: Point) {
    const mid = (a.y + b.y) / 2;
    return `M${a.x} ${a.y} C${a.x} ${mid} ${b.x} ${mid} ${b.x} ${b.y}`;
}

interface ZoneSceneProps {
    zone: WorldZone;
    previousZone: WorldZone | null;
    isFirst: boolean;
    currentNode: WorldNode | null;
    newlyUnlocked: Set<string>;
    currentNodeRef: React.MutableRefObject<HTMLButtonElement | null>;
    avatar: React.ReactNode;
    onPlay: (node: WorldNode) => void;
}

export default function ZoneScene({
    zone,
    previousZone,
    isFirst,
    currentNode,
    newlyUnlocked,
    currentNodeRef,
    avatar,
    onPlay,
}: ZoneSceneProps) {
    const scene = SCENES[zone.id] ?? SCENES.village;
    const previousBoss = previousZone?.nodes[previousZone.nodes.length - 1];
    const { points, height } = layout(zone.nodes);
    const progress = zone.starsTotal ? Math.round((zone.starsEarned / zone.starsTotal) * 100) : 0;

    return (
        <section
            aria-label={zone.name}
            className={`relative overflow-hidden rounded-t-[2.25rem] shadow-[0_-14px_28px_-14px_rgba(16,42,107,0.45)] ${isFirst ? "" : "-mt-9"}`}
            style={{
                backgroundColor: scene.sky[0],
            }}
        >
            <div className="relative mx-auto max-w-[480px]">
                {/* Zone banner */}
                <div className={`relative mx-3 flex items-center gap-3 rounded-3xl bg-white px-3 pb-3 shadow-sm ${isFirst ? "pt-3" : "pt-12"}`}>
                    <div className="plate flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl">
                        {zone.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-display text-2xl font-semibold leading-tight" style={{ color: scene.ink }}>
                            {zone.name}
                        </h2>
                        <p className="text-sm font-semibold leading-snug" style={{ color: scene.ink }}>
                            {zone.description}
                        </p>
                    </div>
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-lift ring-2 ${
                            zone.bossReward.owned ? "ring-secondary" : "ring-primary"
                        }`}
                        title={zone.bossReward.owned ? zone.bossReward.name : "Beat the boss to win this!"}
                    >
                        <span className={zone.bossReward.owned ? "" : "opacity-50"}>
                            {zone.bossReward.owned ? zone.bossReward.emoji : "🎁"}
                        </span>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2 px-4">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white">
                        <div
                            className="h-full rounded-full bg-secondary"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-display text-sm font-semibold" style={{ color: scene.ink }}>
                        <StarIcon size={18} />
                        {zone.starsEarned}/{zone.starsTotal}
                    </span>
                </div>

                {!zone.unlocked && previousBoss && (
                    <p className="mx-4 mt-3 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-ink">
                        <LockIcon size={16} className="shrink-0" />
                        Beat {previousBoss.title} to open this place!
                    </p>
                )}

                {/* The road and its stages */}
                <div className="relative" style={{ aspectRatio: `${W} / ${height}` }}>
                    <svg
                        aria-hidden
                        className="absolute inset-0 h-full w-full"
                        viewBox={`0 0 ${W} ${height}`}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {points.slice(0, -1).map((from, i) => {
                            const to = points[i + 1];
                            const d = curve(from, to);
                            const travelled = zone.nodes[i].stars > 0;
                                            return (
                                <g key={i}>
                                    <path d={d} fill="none" stroke={travelled ? "#FFC21A" : scene.edge} strokeWidth="34" strokeLinecap="round" />
                                    <path d={d} fill="none" stroke={travelled ? "#FFC21A" : scene.road} strokeWidth="26" strokeLinecap="round" />
                                    <path
                                        d={d}
                                        fill="none"
                                        stroke={travelled ? "#FFFFFF" : "#1D4ED8"}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray="1 11"
                                        opacity={1}
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {zone.nodes.map((node, i) => (
                        <StageNode
                            key={node.id}
                            node={node}
                            point={points[i]}
                            height={height}
                            isCurrent={currentNode?.id === node.id}
                            isNew={newlyUnlocked.has(node.id)}
                            currentNodeRef={currentNodeRef}
                            avatar={avatar}
                            onPlay={onPlay}
                        />
                    ))}

                    {/* Hills at the foot of the scene */}
                    <svg
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 left-0 w-full"
                        style={{ height: "10%" , minHeight: 96 }}
                        viewBox="0 0 360 120"
                        preserveAspectRatio="none"
                    >
                        <path d="M0 70 C60 30 120 40 180 62 C240 84 300 30 360 52 V120 H0 Z" fill={scene.hill[0]} />
                        <path d="M0 92 C70 60 140 78 200 90 C260 102 320 70 360 84 V120 H0 Z" fill={scene.hill[1]} />
                    </svg>
                </div>
            </div>
        </section>
    );
}

function StageNode({
    node,
    point,
    height,
    isCurrent,
    isNew,
    currentNodeRef,
    avatar,
    onPlay,
}: {
    node: WorldNode;
    point: Point;
    height: number;
    isCurrent: boolean;
    isNew: boolean;
    currentNodeRef: React.MutableRefObject<HTMLButtonElement | null>;
    avatar: React.ReactNode;
    onPlay: (node: WorldNode) => void;
}) {
    const isBoss = node.type === "boss";
    const locked = !node.unlocked;
    const done = node.stars > 0;
    const size = isBoss ? 88 : 72;

    // Flat faces: white (locked), yellow (ready / boss to beat), blue (cleared)
    const face = locked
        ? { bg: "#FFFFFF", ring: "#1D4ED8" }
        : isBoss && !done
        ? { bg: "#FFC21A", ring: "#1D4ED8" }
        : done
        ? { bg: "#1D4ED8", ring: "#FFFFFF" }
        : { bg: "#FFC21A", ring: "#FFFFFF" };

    // The avatar stands on the roomier side of the road
    const avatarSide = point.x < W / 2 ? "left" : "right";

    return (
        <div
            className="absolute z-10"
            style={{
                left: `${(point.x / W) * 100}%`,
                top: `${(point.y / height) * 100}%`,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
            }}
        >
            {/* Stars arc over the stage */}
            {!locked && (
                <div aria-hidden className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-end gap-0.5" style={{ bottom: "calc(100% + 4px)" }}>
                    <span className="mb-1 -rotate-12"><StarIcon size={22} filled={node.stars >= 1} /></span>
                    <span><StarIcon size={28} filled={node.stars >= 2} /></span>
                    <span className="mb-1 rotate-12"><StarIcon size={22} filled={node.stars >= 3} /></span>
                </div>
            )}

            {isCurrent && (
                <>
                    <span aria-hidden className="animate-ring-pulse pointer-events-none absolute inset-0 rounded-full border-4 border-white" />
                    <span aria-hidden className="animate-ring-pulse pointer-events-none absolute inset-0 rounded-full border-4 border-white" style={{ animationDelay: "0.9s" }} />
                    {/* Outer box positions; inner box floats (an animation would otherwise replace the centring transform) */}
                    <div
                        className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
                        style={{ bottom: "calc(100% + 38px)" }}
                    >
                        <div className="animate-float">
                            <span
                                className="relative block whitespace-nowrap rounded-full bg-secondary px-3.5 py-1 font-display text-sm font-semibold uppercase tracking-wide text-ink shadow-lg ring-2 ring-white"
                            >
                                {isBoss ? "Boss fight" : "Start"}
                                <span aria-hidden className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-secondary" />
                            </span>
                        </div>
                    </div>
                    <div
                        className="pointer-events-none absolute top-1/2 z-20 -translate-y-1/2"
                        style={avatarSide === "left" ? { right: "calc(100% + 10px)" } : { left: "calc(100% + 10px)" }}
                    >
                        <div className="animate-float">{avatar}</div>
                    </div>
                </>
            )}

            {isNew && (
                <span aria-hidden className="animate-fade-up absolute -right-3 -top-4 z-20 text-3xl">
                    🔓
                </span>
            )}

            {/* Wrapper so the unlock wiggle doesn't replace the button's glow */}
            <div className={`h-full w-full ${isNew ? "animate-unlock" : ""}`}>
                <button
                    ref={isCurrent ? currentNodeRef : undefined}
                    type="button"
                    disabled={locked}
                    onClick={() => onPlay(node)}
                    aria-label={`${node.title}${locked ? " (locked)" : ""}`}
                    className={`node-btn relative flex h-full w-full items-center justify-center rounded-full ${locked ? "cursor-not-allowed text-primary" : ""}`}
                    style={
                        {
                            backgroundColor: face.bg,
                            border: `${isBoss ? 5 : 4}px solid ${face.ring}`,
                        } as React.CSSProperties
                    }
                >
                    {locked ? (
                        <LockIcon size={isBoss ? 36 : 30} />
                    ) : (
                        // A white disc behind the picture keeps any emoji readable on any face colour
                        <span
                            className="flex items-center justify-center rounded-full bg-white"
                            style={{ width: size * 0.68, height: size * 0.68 }}
                        >
                            <span className="leading-none" style={{ fontSize: isBoss ? 38 : 30 }}>
                                {node.emoji}
                            </span>
                        </span>
                    )}
                    {done && !locked && (
                        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white ring-[3px] ring-white">
                            <CheckIcon size={16} />
                        </span>
                    )}
                </button>
            </div>

            {/* Label */}
            <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center"
                style={{ top: "calc(100% + 14px)" }}
            >
                {isBoss && !locked && (
                    <span className="mb-0.5 inline-block rounded-full bg-secondary px-2 py-px font-display text-[10px] font-semibold uppercase tracking-widest text-ink">
                        Boss
                    </span>
                )}
                <p className="mx-auto w-max max-w-[8.5rem] rounded-xl bg-white px-2.5 py-1 font-display text-[13px] font-semibold leading-tight text-ink shadow-sm">
                    {node.title}
                </p>
            </div>
        </div>
    );
}
