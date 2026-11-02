/**
 * Icons - small inline SVGs so stars, coins and the dock look identical on every phone
 *
 * Content art (avatars, zone and node pictures, outfits) is still emoji until the
 * Ghanaian art style is commissioned; these are the UI pieces a child sees constantly.
 */
import React from "react";

type IconProps = { className?: string; size?: number };

const STAR_PATH = "M12 2.6l2.8 6 6.6.8-4.9 4.6 1.3 6.6L12 17.2l-5.8 3.4 1.3-6.6L2.6 9.4l6.6-.8L12 2.6z";

/** Gold star; `filled=false` is an empty outline (white with a yellow edge) */
export function StarIcon({ filled = true, size = 24, className = "" }: IconProps & { filled?: boolean }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
            <path
                d={STAR_PATH}
                fill={filled ? "#FFC21A" : "#FFFFFF"}
                stroke="#FFC21A"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Gold coin stamped with the Black Star of Ghana */
export function CoinIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
            <circle cx="12" cy="12" r="10" fill="#FFC21A" />
            <circle cx="12" cy="12" r="7.2" fill="none" stroke="#1D4ED8" strokeWidth="1.2" />
            <path d={STAR_PATH} fill="#1D4ED8" transform="translate(12 12) scale(0.5) translate(-12 -12.2)" />
        </svg>
    );
}

export function LockIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="none">
            <rect x="5" y="10.5" width="14" height="10" rx="3" fill="currentColor" />
            <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
    );
}

export function CheckIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="none">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function HeartIcon({ filled = true, size = 24, className = "" }: IconProps & { filled?: boolean }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
            <path
                d="M12 20.4S3.5 15 3.5 8.9A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.3C20.5 15 12 20.4 12 20.4z"
                fill={filled ? "#1D4ED8" : "rgb(29 78 216 / 0.15)"}
                stroke={filled ? "#1D4ED8" : "rgb(29 78 216 / 0.3)"}
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* Dock icons: 24px, 2px rounded stroke */

function Stroke({ children, size = 24, className = "" }: IconProps & { children: React.ReactNode }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {children}
        </svg>
    );
}

export function MapIcon(props: IconProps) {
    return (
        <Stroke {...props}>
            <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5l-6-2z" />
            <path d="M9 4.5v13M15 6.5v13" />
        </Stroke>
    );
}

export function GiftIcon(props: IconProps) {
    return (
        <Stroke {...props}>
            <rect x="3.5" y="9" width="17" height="11" rx="2.5" />
            <path d="M3.5 13h17M12 9v11" />
            <path d="M12 9c-1.5-3.8-5.5-4-5.5-1.7C6.5 9 9 9 12 9zm0 0c1.5-3.8 5.5-4 5.5-1.7C17.5 9 15 9 12 9z" />
        </Stroke>
    );
}

export function BagIcon(props: IconProps) {
    return (
        <Stroke {...props}>
            <path d="M5.5 8h13l1.2 11.2a1.6 1.6 0 0 1-1.6 1.8H5.9a1.6 1.6 0 0 1-1.6-1.8L5.5 8z" />
            <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" />
        </Stroke>
    );
}

export function GamepadIcon(props: IconProps) {
    return (
        <Stroke {...props}>
            <path d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.4l-.6 3a2.8 2.8 0 0 1-4.6 1.5L14.5 15h-5l-1.7 2.4a2.8 2.8 0 0 1-4.6-1.5l-.6-3A4.5 4.5 0 0 1 7 7.5z" />
            <path d="M8 10.5v3M6.5 12h3" />
            <circle cx="15.5" cy="11" r="0.6" fill="currentColor" />
            <circle cx="17.5" cy="13" r="0.6" fill="currentColor" />
        </Stroke>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <Stroke {...props}>
            <path d="M14.5 5.5 8 12l6.5 6.5" />
        </Stroke>
    );
}

export function CloseIcon(props: IconProps) {
    return (
        <Stroke {...props}>
            <path d="M6 6l12 12M18 6 6 18" />
        </Stroke>
    );
}

/** The Ghana flag, drawn so it renders on Windows too (where flag emoji show as "GH") */
export function GhanaFlag({ width = 22, className = "" }: { width?: number; className?: string }) {
    const height = Math.round((width * 2) / 3);
    return (
        <svg width={width} height={height} viewBox="0 0 30 20" className={`rounded-[3px] ${className}`} aria-label="Ghana flag" role="img">
            <rect width="30" height="6.67" fill="#CE1126" />
            <rect y="6.67" width="30" height="6.67" fill="#FCD116" />
            <rect y="13.33" width="30" height="6.67" fill="#006B3F" />
            <path d={STAR_PATH} fill="#1A1445" transform="translate(15 10) scale(0.38) translate(-12 -11.6)" />
        </svg>
    );
}

/** Placeholder brand mark until the commissioned logo exists */
export function LogoMark({ size = 36, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
            <rect width="40" height="40" rx="12" fill="#1D4ED8" />
            <rect y="0" width="40" height="40" rx="12" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <path d={STAR_PATH} fill="#FFC21A" stroke="#FFC21A" strokeWidth="1.2" strokeLinejoin="round" transform="translate(20 18.5) scale(1.15) translate(-12 -11.6)" />
            <rect x="9" y="31" width="22" height="3" rx="1.5" fill="#FFFFFF" />
        </svg>
    );
}
