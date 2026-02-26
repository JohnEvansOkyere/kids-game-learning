/**
 * Avatar Component - Display student avatar with emoji
 */
import React from "react";
import type { AvatarType } from "@/lib/types";

interface AvatarProps {
    type: AvatarType;
    size?: "small" | "medium" | "large";
    className?: string;
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
}: AvatarProps) {
    return (
        <div
            className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}
        >
            {avatarEmojis[type]}
        </div>
    );
}
