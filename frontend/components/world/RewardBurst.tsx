"use client";

/**
 * RewardBurst - a slowly turning sunburst with confetti falling through it
 *
 * Fills its parent: put it inside a `relative overflow-hidden` box and give the
 * real content `relative` so it sits on top. Transform/opacity only.
 */
import React from "react";

const COLORS = ["#FFC21A", "#1D4ED8"];
const PIECES = 26;

export default function RewardBurst({ confetti = true, className = "" }: { confetti?: boolean; className?: string }) {
    return (
        <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className="animate-rays aspect-square w-[150%]"
                    style={{
                        backgroundImage:
                            "repeating-conic-gradient(from 0deg, rgb(255 216 94 / 0.55) 0deg 10deg, rgb(255 216 94 / 0) 10deg 20deg)",
                        WebkitMaskImage: "radial-gradient(circle, #000 12%, transparent 62%)",
                        maskImage: "radial-gradient(circle, #000 12%, transparent 62%)",
                    }}
                />
            </div>

            {confetti &&
                Array.from({ length: PIECES }, (_, i) => {
                    const style = {
                        left: `${(i * 37) % 100}%`,
                        top: 0,
                        width: 8 + (i % 3) * 2,
                        height: 12 + (i % 4) * 2,
                        backgroundColor: COLORS[i % COLORS.length],
                        animationDelay: `${(i % 9) * 0.12}s`,
                        "--x": `${((i * 53) % 120) - 60}px`,
                        "--r": `${(i * 97) % 720}deg`,
                    } as React.CSSProperties;
                    return <span key={i} className="animate-confetti absolute rounded-[2px] opacity-0" style={style} />;
                })}
        </div>
    );
}
