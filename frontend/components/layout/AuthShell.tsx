/**
 * AuthShell - the parent's first impression
 *
 * A flat blue brand panel (what the app does for your child) beside the form.
 * Stacks on phones: brand band on top, the form card overlapping it.
 * Only claims features that exist today.
 */
import React from "react";
import { CheckIcon, LogoMark } from "@/components/ui/Icons";

const PROMISES = [
    "Built around Ghana's NaCCA curriculum",
    "Plays offline when the data runs out",
    "See exactly which skills your child has mastered",
];

interface AuthShellProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
    return (
        <div className="min-h-screen lg:grid lg:grid-cols-[5fr_6fr]">
            {/* Pinned to the screen on desktop so the promise stays in view while a long form scrolls */}
            <aside className="relative overflow-hidden bg-night text-white lg:sticky lg:top-0 lg:h-screen lg:self-start">
                <div className="relative mx-auto flex h-full max-w-xl flex-col px-6 pb-16 pt-7 lg:px-14 lg:pb-16 lg:pt-14">
                    <div className="flex items-center gap-3">
                        <LogoMark size={40} />
                        <span className="font-display text-2xl font-semibold tracking-tight">MathChampions</span>
                    </div>

                    <div className="mt-8 lg:mt-auto">
                        <h1 className="font-display text-[2rem] font-semibold leading-[1.08] sm:text-4xl lg:text-5xl">
                            Maths they&rsquo;ll <span className="text-secondary">ask</span> to play.
                        </h1>
                        <p className="mt-3 max-w-md text-lg font-semibold text-white">
                            A Ghana adventure that builds real maths skills, from KG1 to P3.
                        </p>

                        <ul className="mt-8 hidden space-y-3.5 lg:block">
                            {PROMISES.map((text) => (
                                <li key={text} className="flex items-center gap-3 font-semibold text-white">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-ink">
                                        <CheckIcon size={16} />
                                    </span>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {/* Top edge on phones (the form card overlaps the bottom), bottom edge beside the form on desktop */}
                <div className="kente-strip absolute inset-x-0 top-0 lg:bottom-0 lg:top-auto" />
            </aside>

            <main className="relative flex justify-center px-4 pb-10 lg:items-center lg:py-14">
                <div className="relative z-10 -mt-9 w-full max-w-md lg:mt-0">
                    <div className="card !rounded-4xl !p-6 sm:!p-8">
                        <h2 className="font-display text-3xl font-semibold text-ink">{title}</h2>
                        {subtitle && <p className="mt-1 font-semibold text-ink-muted">{subtitle}</p>}
                        <div className="mt-6">{children}</div>
                    </div>
                    {footer && <div className="mt-5 text-center font-semibold text-ink-soft">{footer}</div>}
                </div>
            </main>
        </div>
    );
}
