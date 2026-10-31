"use client";

/**
 * CoinBurst - a few coins fly out from the middle of the parent and fade
 *
 * Place inside a `relative` element. Remount (change `key`) to replay.
 */
import React from "react";

const COINS = 8;

export default function CoinBurst() {
    return (
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {Array.from({ length: COINS }, (_, i) => {
                const angle = (i / COINS) * 2 * Math.PI;
                const style = {
                    "--dx": `${Math.round(Math.cos(angle) * 80)}px`,
                    "--dy": `${Math.round(Math.sin(angle) * 55 - 20)}px`,
                    animationDelay: `${(i % 3) * 40}ms`,
                } as React.CSSProperties;
                return (
                    <span key={i} className="absolute text-2xl animate-coin-burst" style={style}>
                        🪙
                    </span>
                );
            })}
        </span>
    );
}
