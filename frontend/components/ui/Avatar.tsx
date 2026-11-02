/**
 * Avatar Component - the child's animal, optionally on a white character plate
 *
 * The illustrated animal stays readable at small HUD size and on selection cards.
 * With `plate` it sits on a flat white disc with a blue ring.
 */
import React from "react";
import Image from "next/image";
import type { AvatarType } from "@/lib/types";

interface AvatarProps {
    type: AvatarType;
    size?: "small" | "medium" | "large";
    className?: string;
    outfit?: string | null; // emoji of the equipped outfit
    plate?: boolean;
}

const sizeClasses = {
    small: "h-12 w-12",
    medium: "h-20 w-20",
    large: "h-32 w-32",
};

// Plate diameter and emoji size
const plateSizes = {
    small: "h-12 w-12",
    medium: "h-20 w-20",
    large: "h-32 w-32",
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
                className={`plate relative flex shrink-0 items-center justify-center rounded-full bg-white ring-[3px] ring-primary ${plateSizes[size]} ${className}`}
            >
                <Image src={`/avatars/${type}.webp`} alt="" width={256} height={256} unoptimized className="h-[90%] w-[90%] object-contain drop-shadow-[0_2px_0_rgba(0,0,0,0.12)]" />
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
            <Image src={`/avatars/${type}.webp`} alt={`${type} avatar`} width={256} height={256} unoptimized className="h-full w-full object-contain" />
            {outfit && (
                <span className="absolute -top-[0.35em] left-1/2 -translate-x-1/2 text-[0.55em] leading-none">
                    {outfit}
                </span>
            )}
        </div>
    );
}
