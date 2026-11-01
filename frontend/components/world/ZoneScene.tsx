"use client";

/**
 * ZoneScene - one zone of the Adventure World as a painted landscape
 *
 * A winding road runs through the stage nodes; stars arc over each node, the
 * stage the child should play next pulses with a START bubble, and the boss
 * sits at the end. Compressed zone illustrations sit behind the SVG path.
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

const SCENES: Record<string, Scene> = {
    village: { sky: ["#FFF0CC", "#FFB86B"], hill: ["#F6A04D", "#E07B24"], road: "#FFF6E3", edge: "#E3A560", ink: "#7C2D12" },
    farm: { sky: ["#EEFBD2", "#A6E57E"], hill: ["#62CC5E", "#35A853"], road: "#FBFFEF", edge: "#8FC96A", ink: "#14532D" },
    market: { sky: ["#FFF3C2", "#FFCF5C"], hill: ["#F5A623", "#D98209"], road: "#FFF9E4", edge: "#E2B04A", ink: "#78350F" },
    forest: { sky: ["#C9F5DC", "#46C48D"], hill: ["#1FA06C", "#0F7B50"], road: "#EBFFF5", edge: "#5FC99B", ink: "#064E3B" },
    coast: { sky: ["#C9EFFF", "#62CBF6"], hill: ["#F6D88F", "#EBBB5E"], road: "#FFFFFF", edge: "#9ADBF3", ink: "#0C4A6E" },
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
            className={`relative overflow-hidden rounded-t-[2.25rem] shadow-[0_-14px_28px_-14px_rgba(35,27,92,0.35)] ${isFirst ? "" : "-mt-9"}`}
            style={{
                backgroundImage: `radial-gradient(circle at 88% 4%, rgb(255 255 255 / 0.8), transparent 34%), linear-gradient(180deg, ${scene.sky[0]}, ${scene.sky[1]})`,
                filter: zone.unlocked ? undefined : "saturate(0.5) brightness(0.97)",
            }}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-cover bg-center opacity-65"
                style={{
                    backgroundImage: `url('/zones/${zone.id in SCENES ? zone.id : "village"}.webp')`,
                    maskImage: "linear-gradient(to bottom, black 0%, black 34%, transparent 100%)",
                }}
            />
            {/* Soft clouds drifting behind the road */}
            <span aria-hidden className="animate-drift pointer-events-none absolute left-[6%] top-[26%] h-7 w-28 rounded-full bg-white/60 blur-[2px]" />
            <span aria-hidden className="animate-drift pointer-events-none absolute right-[4%] top-[58%] h-6 w-24 rounded-full bg-white/50 blur-[2px]" style={{ animationDuration: "24s" }} />

            <div className="relative mx-auto max-w-[480px]">
                {/* Zone banner */}
                <div className={`relative mx-3 flex items-center gap-3 rounded-3xl bg-white/75 px-3 pb-3 shadow-sm backdrop-blur-[2px] ${isFirst ? "pt-3" : "pt-12"}`}>
                    <div className="plate flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl">
                        {zone.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-display text-2xl font-semibold leading-tight" style={{ color: scene.ink }}>
                            {zone.name}
                        </h2>
                        <p className="text-sm font-semibold leading-snug" style={{ color: scene.ink, opacity: 0.75 }}>
                            {zone.description}
                        </p>
                    </div>
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 text-2xl shadow-lift ring-2 ${
                            zone.bossReward.owned ? "ring-secondary" : "ring-white/60"
                        }`}
                        title={zone.bossReward.owned ? zone.bossReward.name : "Beat the boss to win this!"}
                    >
                        <span className={zone.bossReward.owned ? "" : "opacity-50 grayscale"}>
                            {zone.bossReward.owned ? zone.bossReward.emoji : "🎁"}
                        </span>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2 px-4">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/10 ring-1 ring-black/5">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-secondary-light to-secondary"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="inline-flex items-center gap-1 font-display text-sm font-semibold" style={{ color: scene.ink }}>
                        <StarIcon size={18} />
                        {zone.starsEarned}/{zone.starsTotal}
                    </span>
                </div>

                {!zone.unlocked && previousBoss && (
                    <p className="mx-4 mt-3 flex items-center gap-2 rounded-2xl bg-night/85 px-3 py-2 text-sm font-semibold text-white">
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
                            const reachable = zone.nodes[i + 1].unlocked;
                            return (
                                <g key={i} opacity={reachable ? 1 : 0.55}>
                                    <path d={d} fill="none" stroke={travelled ? "#E0A100" : scene.edge} strokeWidth="34" strokeLinecap="round" />
                                    <path d={d} fill="none" stroke={travelled ? "#FFE08A" : scene.road} strokeWidth="26" strokeLinecap="round" />
                                    <path
                                        d={d}
                                        fill="none"
                                        stroke={travelled ? "#F2A900" : scene.edge}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray="1 11"
                                        opacity={travelled ? 0.9 : 0.6}
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

    // Face colours: grey stone (locked), gold (ready), green (cleared), crimson (boss to beat)
    const face = locked
        ? { bg: "linear-gradient(180deg,#D8DCEA,#A4ADC6)", ledge: "#7C86A3", ring: "#EEF0F8" }
        : isBoss && !done
        ? { bg: "linear-gradient(180deg,#FF8A7A,#FF4D3D)", ledge: "#A82217", ring: "#FCD116" }
        : done
        ? { bg: "linear-gradient(180deg,#7BEBAE,#22C06B)", ledge: "#12904A", ring: "#FFFFFF" }
        : { bg: "linear-gradient(180deg,#FFE27A,#FFC21A)", ledge: "#C98600", ring: "#FFFFFF" };

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
                                className={`relative block whitespace-nowrap rounded-full px-3.5 py-1 font-display text-sm font-semibold uppercase tracking-wide text-white shadow-lg ring-2 ring-white ${
                                    isBoss ? "bg-danger" : "bg-success"
                                }`}
                            >
                                {isBoss ? "Boss fight" : "Start"}
                                <span aria-hidden className={`absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1.5 rotate-45 ${isBoss ? "bg-danger" : "bg-success"}`} />
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
                    className={`node-btn relative flex h-full w-full items-center justify-center rounded-full ${locked ? "cursor-not-allowed text-ink/45" : ""}`}
                    style={
                        {
                            backgroundImage: face.bg,
                            border: `${isBoss ? 5 : 4}px solid ${face.ring}`,
                            "--ledge": face.ledge,
                        } as React.CSSProperties
                    }
                >
                    {locked ? (
                        <LockIcon size={isBoss ? 36 : 30} />
                    ) : (
                        // A soft disc behind the picture keeps any emoji readable on any face colour
                        <span
                            className="flex items-center justify-center rounded-full bg-white/45"
                            style={{ width: size * 0.68, height: size * 0.68 }}
                        >
                            <span className="leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.15)]" style={{ fontSize: isBoss ? 38 : 30 }}>
                                {node.emoji}
                            </span>
                        </span>
                    )}
                    {done && !locked && (
                        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-success text-white ring-[3px] ring-white">
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
                    <span className="mb-0.5 inline-block rounded-full bg-danger px-2 py-px font-display text-[10px] font-semibold uppercase tracking-widest text-white">
                        Boss
                    </span>
                )}
                <p className="mx-auto w-max max-w-[8.5rem] rounded-xl bg-white/85 px-2.5 py-1 font-display text-[13px] font-semibold leading-tight text-ink shadow-sm backdrop-blur-sm">
                    {node.title}
                </p>
            </div>
        </div>
    );
}
