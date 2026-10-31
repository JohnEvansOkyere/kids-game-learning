/**
 * Avatar Component - the child's animal, optionally on a coloured character plate
 *
 * Without `plate` it is a bare emoji sized like text (old behaviour).
 * With `plate` it sits on a round gradient disc, so it reads as a character.
 */
import React from "react";
import type { AvatarType } from "@/lib/types";

interface AvatarProps {
    type: AvatarType;
    size?: "small" | "medium" | "large";
    className?: string;
    outfit?: string | null; // emoji of the equipped outfit
    plate?: boolean;
}

const avatarEmojis: Record<AvatarType, string> = {
    lion: "🦁",
    elephant: "🐘",
    cheetah: "🐆",
    monkey: "🐵",
    eagle: "🦅",
    fish: "🐠",
};

// One warm, distinct colour per animal so siblings are told apart at a glance
const plateColors: Record<AvatarType, string> = {
    lion: "linear-gradient(160deg,#FFE27A,#FFA928)",
    elephant: "linear-gradient(160deg,#B9D8FF,#6BA6FF)",
    cheetah: "linear-gradient(160deg,#FFC38A,#FF8A3D)",
    monkey: "linear-gradient(160deg,#D9C2A3,#B8895B)",
    eagle: "linear-gradient(160deg,#FFB3C1,#FF6F8E)",
    fish: "linear-gradient(160deg,#9CF0E3,#2FC4B2)",
};

const sizeClasses = {
    small: "text-4xl",
    medium: "text-6xl",
    large: "text-8xl",
};

// Plate diameter and emoji size
const plateSizes = {
    small: "h-12 w-12 text-[1.6rem]",
    medium: "h-20 w-20 text-5xl",
    large: "h-32 w-32 text-[4.5rem]",
};

export default function Avatar({
    type,
    size = "medium",
    className = "",
    outfit = null,
    plate = false,
}: AvatarProps) {
    if (plate) {
        return (
            <div
                className={`plate relative flex shrink-0 items-center justify-center rounded-full ring-[3px] ring-white ${plateSizes[size]} ${className}`}
                style={{ backgroundImage: plateColors[type] }}
            >
                <span className="leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.12)]">{avatarEmojis[type]}</span>
                {outfit && (
                    <span className="absolute -top-[0.28em] left-1/2 -translate-x-1/2 text-[0.62em] leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.15)]">
                        {outfit}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div
            className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}
        >
            {avatarEmojis[type]}
            {outfit && (
                <span className="absolute -top-[0.35em] left-1/2 -translate-x-1/2 text-[0.55em] leading-none">
                    {outfit}
                </span>
            )}
        </div>
    );
}
