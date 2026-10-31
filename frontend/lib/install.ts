/**
 * "Add to home screen" support
 *
 * Chrome fires beforeinstallprompt once, often before the parent screen has
 * mounted, so the event is kept here until InstallPrompt asks for it.
 */
export interface InstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "installPromptDismissedAt";
// Ask again after a week if the parent said "not now"
const ASK_AGAIN_MS = 7 * 24 * 60 * 60 * 1000;
const CHANGED_EVENT = "mc-install-prompt";

let savedPrompt: InstallPromptEvent | null = null;

export function rememberInstallPrompt(event: InstallPromptEvent) {
    savedPrompt = event;
    window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function getInstallPrompt() {
    return savedPrompt;
}

export function onInstallPromptChange(listener: () => void) {
    window.addEventListener(CHANGED_EVENT, listener);
    return () => window.removeEventListener(CHANGED_EVENT, listener);
}

/** Show the prompt; true if the parent installed the app */
export async function promptInstall(): Promise<boolean> {
    if (!savedPrompt) return false;
    const event = savedPrompt;
    savedPrompt = null;
    await event.prompt();
    const { outcome } = await event.userChoice;
    window.dispatchEvent(new Event(CHANGED_EVENT));
    return outcome === "accepted";
}

export function isInstalled() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

export function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function wasDismissedRecently() {
    try {
        return Date.now() - Number(localStorage.getItem(DISMISSED_KEY) || 0) < ASK_AGAIN_MS;
    } catch {
        return false;
    }
}

export function dismissInstallPrompt() {
    try {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
        // storage blocked - the card will just show again next time
    }
}
