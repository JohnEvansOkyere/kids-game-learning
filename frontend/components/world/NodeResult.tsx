"use client";

/**
 * NodeResult - reports a finished Adventure World node and shows the rewards
 */
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import CoinBurst from "@/components/world/CoinBurst";
import { playCoinSFX, playUnlockSFX } from "@/app/practice/GameAudio";
import { trackEvent } from "@/lib/events";
import { worldApi } from "@/lib/api";
import { findNextNode, loadWorld, nodeHref, queueNodeCompletion, starString } from "@/lib/world";
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
                    <p className="text-5xl mb-2 animate-bounce-in" aria-label={`${result.stars} of 3 stars`}>
                        {starString(result.stars)}
                    </p>

                    {result.stars === 0 ? (
                        <p className="text-xl font-bold text-danger mb-4">
                            So close! Get 1 star to open the next place. 💪
                        </p>
                    ) : (
                        <p className="text-xl font-bold text-success mb-4">
                            {result.firstClear ? "New record! 🎉" : "Well done! 🎉"}
                        </p>
                    )}

                    {result.coinsEarned > 0 && (
                        <p className="relative text-2xl font-bold text-secondary-dark mb-2">
                            <span className="inline-block animate-pop">+{result.coinsEarned} 🪙</span>
                            <CoinBurst />
                        </p>
                    )}

                    {result.rewardItem && (
                        <div className="bg-secondary/20 border-4 border-secondary rounded-2xl p-4 my-4 animate-bounce-in">
                            <p className="text-6xl">{result.rewardItem.emoji}</p>
                            <p className="text-xl font-bold text-primary">
                                You found {result.rewardItem.name}!
                            </p>
                        </div>
                    )}

                    {result.unlockedNodeIds.length > 0 && (
                        <p className="text-lg font-bold text-primary mb-4">
                            <span className="inline-block animate-unlock" style={{ animationDelay: "1.1s" }}>
                                🔓
                            </span>{" "}
                            A new place is open on your map!
                        </p>
                    )}
                </>
            ) : offline ? (
                <p className="text-lg font-bold text-danger mb-4">
                    You&apos;re offline. Your stars will be saved when you&apos;re back online.
                </p>
            ) : (
                <p className="text-lg text-gray-600 mb-4">Counting your stars...</p>
            )}

            <div className="flex flex-wrap gap-4 justify-center mt-4">
                {onPlayAgain && (
                    <Button
                        variant="secondary"
                        onClick={() => {
                            trackEvent(studentId, "node_start", { nodeId, from: "again" });
                            onPlayAgain();
                        }}
                    >
                        🔄 Play Again
                    </Button>
                )}
                <Button variant="primary" onClick={() => router.push("/play")}>
                    🗺️ Back to Map
                </Button>
                {nextNode && (
                    // Full page load so the game page starts fresh with the new node
                    <Button
                        variant="success"
                        onClick={() => {
                            trackEvent(studentId, "node_start", { nodeId: nextNode.id, from: "next" });
                            window.location.assign(nodeHref(nextNode));
                        }}
                    >
                        {nextNode.emoji} Next Stage ▶️
                    </Button>
                )}
            </div>
        </div>
    );
}
