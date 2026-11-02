"use client";

/**
 * ModalSheet - rises from the bottom on phones (thumb-friendly), floats centred otherwise
 */
import React, { useEffect } from "react";
import { CloseIcon } from "@/components/ui/Icons";

interface ModalSheetProps {
    children: React.ReactNode;
    onClose: () => void;
    /** "sheet" hugs the bottom edge on phones; "center" always floats */
    variant?: "sheet" | "center";
    /** false for moments the child shouldn't skip, like the chest shaking */
    dismissible?: boolean;
    label: string;
}

export default function ModalSheet({ children, onClose, variant = "center", dismissible = true, label }: ModalSheetProps) {
    useEffect(() => {
        if (!dismissible) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [dismissible, onClose]);

    const isSheet = variant === "sheet";

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`animate-fade-in fixed inset-0 z-50 flex justify-center bg-night/90 ${
                isSheet ? "items-end sm:items-center sm:p-4" : "items-center p-4"
            }`}
            onClick={dismissible ? onClose : undefined}
        >
            <div
                className={`animate-sheet-up relative w-full max-w-md overflow-y-auto bg-white text-center shadow-2xl ${
                    isSheet ? "max-h-[90vh] rounded-t-4xl pb-[env(safe-area-inset-bottom)] sm:rounded-4xl" : "max-h-[90vh] rounded-4xl"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {isSheet && <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-ink/15 sm:hidden" />}
                {dismissible && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 text-ink-soft transition-colors hover:bg-ink/10"
                    >
                        <CloseIcon size={22} />
                    </button>
                )}
                {children}
            </div>
        </div>
    );
}
