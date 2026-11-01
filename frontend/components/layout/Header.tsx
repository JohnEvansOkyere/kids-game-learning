/**
 * Header Component - slim brand bar with a kente strip
 *
 * Quiet on purpose: the games and the map are the show, not the navbar.
 */
import React from "react";
import { GhanaFlag, LogoMark } from "@/components/ui/Icons";

export default function Header() {
    return (
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                <div className="flex items-center gap-2.5">
                    <LogoMark size={32} />
                    <span className="font-display text-xl font-semibold tracking-tight text-ink">
                        MathChampions
                    </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 py-1 pl-2 pr-3 text-xs font-bold uppercase tracking-wide text-ink-soft">
                    <GhanaFlag width={18} />
                    Ghana
                </span>
            </div>
            <div className="kente-strip" />
        </header>
    );
}
