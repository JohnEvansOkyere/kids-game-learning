/**
 * Avatar Component - Display student avatar with emoji
 */
import React from "react";
import type { AvatarType } from "@/lib/types";

interface AvatarProps {
    type: AvatarType;
    size?: "small" | "medium" | "large";
    className?: string;
    outfit?: string | null; // emoji of the equipped outfit
}

const avatarEmojis: Record<AvatarType, string> = {
    lion: "🦁",
    elephant: "🐘",
    cheetah: "🐆",
    monkey: "🐵",
    eagle: "🦅",
    fish: "🐠",
};

const sizeClasses = {
    small: "text-4xl",
    medium: "text-6xl",
    large: "text-8xl",
};

export default function Avatar({
    type,
    size = "medium",
    className = "",
    outfit = null,
}: AvatarProps) {
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
