"use client";

/**
 * NodeResult - reports a finished Adventure World node and shows the rewards
 *
 * The reveal is sequenced on purpose: stars land one by one, then the coins, then
 * the unlock. "Next stage" is the big button, so the child's next tap keeps them going.
 */
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { CoinIcon, StarIcon } from "@/components/ui/Icons";
import CoinBurst from "@/components/world/CoinBurst";
import { playCoinSFX, playUnlockSFX } from "@/app/practice/GameAudio";
import { trackEvent } from "@/lib/events";
import { worldApi } from "@/lib/api";
import { findNextNode, loadWorld, nodeHref, queueNodeCompletion } from "@/lib/world";
import type { NodeCompleteResponse, WorldNode } from "@/lib/types";

interface NodeResultProps {
    studentId: string;
    nodeId: string;
    correct: number;
    total: number;
    won?: boolean;
    onPlayAgain?: () => void;
}

export default function NodeResult({
    studentId,
    nodeId,
    correct,
    total,
    won,
    onPlayAgain,
}: NodeResultProps) {
    const router = useRouter();
    const [result, setResult] = useState<NodeCompleteResponse | null>(null);
    const [offline, setOffline] = useState(false);
    const [nextNode, setNextNode] = useState<WorldNode | null>(null);
    const sentRef = useRef(false);

    useEffect(() => {
        // Report once, even under React strict-mode double effects
        if (sentRef.current) return;
        sentRef.current = true;

        const payload = { correct, total: Math.max(1, total), won };
        worldApi
            .completeNode(studentId, nodeId, payload)
            .then((res) => {
                setResult(res);
                trackEvent(studentId, "node_complete", { nodeId, correct, total, stars: res.stars });
                // Let the game's own end sound finish first
                if (res.coinsEarned > 0) setTimeout(playCoinSFX, 500);
                if (res.unlockedNodeIds.length > 0) setTimeout(playUnlockSFX, 1100);
                // Reload the map so newly unlocked stages count
                loadWorld(studentId)
                    .then((world) => setNextNode(findNextNode(world, nodeId)))
                    .catch(() => setNextNode(null));
            })
            .catch((err) => {
                if (!err?.response) {
                    queueNodeCompletion({ studentId, nodeId, result: payload });
                    trackEvent(studentId, "node_complete", { nodeId, correct, total, stars: null });
                    setOffline(true);
                }
            });
    }, [studentId, nodeId, correct, total, won]);

    return (
        <div className="text-center">
            {result ? (
                <>
                    {/* Stars land one at a time, the middle one biggest */}
                    <div className="mb-3 flex items-end justify-center gap-1" role="img" aria-label={`${result.stars} of 3 stars`}>
                        {[0, 1, 2].map((i) => {
                            const filled = result.stars > i;
                            return (
                                <span
                                    key={i}
                                    className={filled ? "animate-star-pop" : ""}
                                    style={{
                                        animationDelay: `${0.25 + i * 0.35}s`,
                                        marginBottom: i === 1 ? 0 : 14,
                                        transform: filled ? undefined : `rotate(${i === 0 ? -10 : i === 2 ? 10 : 0}deg)`,
                                    }}
                                >
                                    <StarIcon size={i === 1 ? 84 : 64} filled={filled} />
                                </span>
                            );
                        })}
                    </div>

                    {result.stars === 0 ? (
                        <p className="mb-4 font-display text-xl font-semibold text-ink-soft">
                            So close! Get 1 star to open the next place. 💪
                        </p>
                    ) : (
                        <p className="mb-4 font-display text-2xl font-semibold text-success-dark">
                            {result.firstClear ? "New record!" : "Well done!"}
                        </p>
                    )}

                    {result.coinsEarned > 0 && (
                        <p className="relative mb-3 inline-block font-display text-4xl font-semibold text-ink">
                            <span className="inline-flex animate-pop items-center gap-2">
                                <CoinIcon size={40} />+{result.coinsEarned}
                            </span>
                            <CoinBurst />
                        </p>
                    )}

                    {result.rewardItem && (
                        <div className="mx-auto my-4 max-w-[16rem] animate-bounce-in rounded-3xl bg-secondary/20 p-4 ring-2 ring-secondary">
                            <p className="text-6xl leading-none">{result.rewardItem.emoji}</p>
                            <p className="mt-2 font-display text-xl font-semibold text-ink">
                                You found {result.rewardItem.name}!
                            </p>
                        </div>
                    )}

                    {result.unlockedNodeIds.length > 0 && (
                        <p className="mb-4 font-display text-lg font-semibold text-primary">
                            <span className="inline-block animate-unlock" style={{ animationDelay: "1.1s" }}>
                                🔓
                            </span>{" "}
                            A new place is open on your map!
                        </p>
                    )}
                </>
            ) : offline ? (
                <p className="mb-4 font-semibold text-ink-soft">
                    You&apos;re offline. Your stars will be saved when you&apos;re back online.
                </p>
            ) : (
                <p className="mb-4 font-display text-lg font-semibold text-ink-muted">Counting your stars…</p>
            )}

            <div className="mx-auto mt-5 flex max-w-sm flex-col gap-3">
                {nextNode && (
                    // Full page load so the game page starts fresh with the new node
                    <Button
                        variant="success"
                        fullWidth
                        onClick={() => {
                            trackEvent(studentId, "node_start", { nodeId: nextNode.id, from: "next" });
                            window.location.assign(nodeHref(nextNode));
                        }}
                    >
                        {nextNode.emoji} Next stage
                    </Button>
                )}
                <div className="flex gap-3">
                    {onPlayAgain && (
                        <Button
                            variant="neutral"
                            className="flex-1 whitespace-nowrap !px-3"
                            onClick={() => {
                                trackEvent(studentId, "node_start", { nodeId, from: "again" });
                                onPlayAgain();
                            }}
                        >
                            Play again
                        </Button>
                    )}
                    <Button
                        variant={nextNode ? "neutral" : "primary"}
                        className="flex-1 whitespace-nowrap !px-3"
                        onClick={() => router.push("/play")}
                    >
                        Back to map
                    </Button>
                </div>
            </div>
        </div>
    );
}
