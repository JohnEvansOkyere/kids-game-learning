"use client";

/**
 * InstallPrompt - a popup asking to put MathChampions on the home screen
 *
 * Mounted once in the root layout. It pops up:
 * - right after sign-up, on the child's first map screen
 * - on parent screens and "Who's playing?" (never inside a game)
 * and stays away for a week after "Not now", and for good once installed.
 *
 * Android/Chrome: one tap opens the browser's install dialog.
 * Other Android browsers: points at the browser menu.
 * iPhone/iPad: there is no install dialog, so it shows Share → Add to Home Screen.
 */
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import ModalSheet from "@/components/world/ModalSheet";
import {
    dismissInstallPrompt,
    getInstallPrompt,
    isAndroid,
    isInstalled,
    isIos,
    onInstallPromptChange,
    promptInstall,
    takeJustRegistered,
    wasDismissedRecently,
} from "@/lib/install";

type Mode = "hidden" | "prompt" | "ios" | "android-menu";

// Screens where a popup won't interrupt a child mid-question
const PARENT_SCREENS = ["/parent/dashboard", "/student/select", "/dashboard"];
// Long enough for the page to settle (and for Chrome's install event to arrive)
const SHOW_AFTER_MS = 2500;

function installMode(): Mode {
    if (isInstalled()) return "hidden";
    if (getInstallPrompt()) return "prompt";
    if (isIos()) return "ios";
    if (isAndroid()) return "android-menu";
    return "hidden"; // desktop without an install prompt
}

function ShareGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="inline -mt-1">
            <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
            <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
        </svg>
    );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-3 text-left">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-white">{n}</span>
            <span className="pt-0.5 font-semibold text-ink-soft">{children}</span>
        </li>
    );
}

export default function InstallPrompt() {
    const pathname = usePathname();
    const [mode, setMode] = useState<Mode>("hidden");

    useEffect(() => {
        const justRegistered = takeJustRegistered();
        const allowedHere = justRegistered || PARENT_SCREENS.includes(pathname);
        if (!allowedHere || isInstalled() || (!justRegistered && wasDismissedRecently())) {
            setMode("hidden");
            return;
        }

        const timer = window.setTimeout(() => setMode(installMode()), SHOW_AFTER_MS);
        // Chrome's event can land after the popup opened with menu instructions; upgrade to the one-tap button
        const off = onInstallPromptChange(() => setMode((m) => (m === "hidden" ? m : installMode())));
        return () => {
            window.clearTimeout(timer);
            off();
        };
    }, [pathname]);

    if (mode === "hidden") return null;

    const notNow = () => {
        dismissInstallPrompt();
        setMode("hidden");
    };

    return (
        <ModalSheet variant="sheet" label="Add MathChampions to your home screen" onClose={notNow}>
            <div className="px-6 pb-6 pt-8 sm:px-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/icons/icon-192.png"
                    alt=""
                    width={88}
                    height={88}
                    className="mx-auto h-[88px] w-[88px] rounded-[22px] shadow-card ring-1 ring-ink/10"
                />
                <h2 className="mt-4 font-display text-2xl font-semibold text-ink">Add to your home screen</h2>
                <p className="mx-auto mt-1 max-w-xs font-semibold text-ink-muted">
                    Open MathChampions in one tap, like an app, and play even when the data runs out.
                </p>

                {mode === "ios" && (
                    <ol className="mx-auto mt-5 max-w-xs space-y-3">
                        <Step n={1}>
                            Tap <span className="font-bold text-ink">Share</span> <ShareGlyph /> at the bottom of Safari
                        </Step>
                        <Step n={2}>
                            Choose <span className="font-bold text-ink">Add to Home Screen</span>
                        </Step>
                        <Step n={3}>Open the new icon and log in once more</Step>
                    </ol>
                )}

                {mode === "android-menu" && (
                    <ol className="mx-auto mt-5 max-w-xs space-y-3">
                        <Step n={1}>
                            Tap the browser menu <span className="font-bold text-ink">⋮</span>
                        </Step>
                        <Step n={2}>
                            Choose <span className="font-bold text-ink">Add to Home screen</span> or <span className="font-bold text-ink">Install app</span>
                        </Step>
                    </ol>
                )}

                <div className="mt-6 flex flex-col gap-2">
                    {mode === "prompt" && (
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={async () => {
                                const installed = await promptInstall();
                                setMode(installed ? "hidden" : installMode());
                            }}
                        >
                            Add to home screen
                        </Button>
                    )}
                    <Button variant={mode === "prompt" ? "neutral" : "primary"} fullWidth onClick={notNow}>
                        {mode === "prompt" ? "Not now" : "Got it"}
                    </Button>
                </div>
            </div>
        </ModalSheet>
    );
}
