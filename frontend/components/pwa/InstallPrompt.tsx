"use client";

/**
 * InstallPrompt - asks a parent to put MathChampions on the home screen
 *
 * Android/Chrome: one tap opens the browser's install dialog.
 * iPhone: there is no install dialog, so it explains Share → Add to Home Screen.
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
        <div className="bg-white border-4 border-primary rounded-3xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="text-5xl" aria-hidden>
                📲
            </span>
            <div className="flex-1">
                <p className="text-lg font-bold text-primary">Put MathChampions on your home screen</p>
                <p className="text-gray-600">
                    {mode === "ios"
                        ? "Tap the Share button, then “Add to Home Screen”. Your child can then open it like an app, even with no data."
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
                <Button variant="secondary" onClick={notNow}>
                    Not now
                </Button>
            </div>
        </div>
    );
}
