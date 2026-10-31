"use client";

/**
 * ServiceWorker - registers /sw.js (production only) and keeps the browser's
 * install prompt so InstallPrompt can show it later on a parent screen
 */
import { useEffect } from "react";
import { rememberInstallPrompt, type InstallPromptEvent } from "@/lib/install";

export default function ServiceWorker() {
    useEffect(() => {
        const onPrompt = (event: Event) => {
            // Stop Chrome's own mini-bar: parents get our card instead of a kid tapping it mid-game
            event.preventDefault();
            rememberInstallPrompt(event as InstallPromptEvent);
        };
        window.addEventListener("beforeinstallprompt", onPrompt);

        // In development a service worker would serve stale pages after every edit
        if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => {
                // offline support is a bonus; the app works without it
            });
        }

        return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    }, []);

    return null;
}
