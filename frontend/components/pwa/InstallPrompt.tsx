"use client";

/**
 * InstallPrompt - asks a parent to put MathChampions on the home screen
 *
 * Android/Chrome: one tap opens the browser's install dialog.
 * iPhone/iPad: there is no install dialog, so it explains Share → Add to Home Screen.
 * The installed app there has its own storage, so the parent logs in again once.
 * Hidden once installed, and for a week after "Not now".
 */
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
    dismissInstallPrompt,
    getInstallPrompt,
    isInstalled,
    isIos,
    onInstallPromptChange,
    promptInstall,
    wasDismissedRecently,
} from "@/lib/install";

type Mode = "hidden" | "android" | "ios";

function currentMode(): Mode {
    if (isInstalled() || wasDismissedRecently()) return "hidden";
    if (getInstallPrompt()) return "android";
    return isIos() ? "ios" : "hidden";
}

export default function InstallPrompt() {
    const [mode, setMode] = useState<Mode>("hidden");

    useEffect(() => {
        setMode(currentMode());
        return onInstallPromptChange(() => setMode(currentMode()));
    }, []);

    if (mode === "hidden") return null;

    const notNow = () => {
        dismissInstallPrompt();
        setMode("hidden");
    };

    return (
        <div className="mb-6 flex flex-col items-center gap-3 rounded-3xl bg-white p-4 text-center text-ink shadow-card ring-1 ring-ink/5 sm:flex-row sm:text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl" aria-hidden>
                📲
            </span>
            <div className="flex-1">
                <p className="font-display text-lg font-semibold text-ink">Put MathChampions on your home screen</p>
                <p className="text-sm font-semibold text-ink-muted">
                    {mode === "ios"
                        ? "Tap the Share button, then “Add to Home Screen”. Open the new icon and log in once more. Your child can then play like an app, even with no data."
                        : "Your child can open it like an app, and play even when the data runs out."}
                </p>
            </div>
            <div className="flex gap-2">
                {mode === "android" && (
                    <Button
                        variant="primary"
                        onClick={async () => {
                            if (!(await promptInstall())) setMode(currentMode());
                        }}
                    >
                        Add app
                    </Button>
                )}
                <Button variant="neutral" onClick={notNow}>
                    Not now
                </Button>
            </div>
        </div>
    );
}
