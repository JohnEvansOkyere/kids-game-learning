"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/layout/AuthShell";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { authApi, getErrorMessage } from "@/lib/api";
import { markJustRegistered } from "@/lib/install";
import type { AvatarType, GradeLevel } from "@/lib/types";

const avatarOptions: AvatarType[] = ["lion", "elephant", "cheetah", "monkey", "eagle", "fish"];
const gradeOptions: GradeLevel[] = ["KG1", "KG2", "P1", "P2", "P3"];

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Parent info
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [parentName, setParentName] = useState("");

    // Child info
    const [childName, setChildName] = useState("");
    const [childAvatar, setChildAvatar] = useState<AvatarType>("lion");
    const [childGradeLevel, setChildGradeLevel] = useState<GradeLevel>("P1");

    const handleParentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setStep(2);
    };

    const handleChildSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // No email check: the account is ready the moment this returns
            const response = await authApi.register({
                email: email.trim(),
                password,
                parentName: parentName.trim(),
                childName: childName.trim(),
                childAvatar,
                childGradeLevel,
            });

            localStorage.setItem("user", JSON.stringify(response.user));
            localStorage.setItem("parent", JSON.stringify(response.parent));
            localStorage.setItem("students", JSON.stringify([response.student]));
            // Only one child so far, so skip "Who's playing?" and open their world
            localStorage.setItem("selectedStudent", JSON.stringify(response.student));
            markJustRegistered();

            router.replace("/play");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const stepper = (
        <div className="mb-6" aria-label={`Step ${step} of 2`}>
            <div className="flex gap-2">
                {[1, 2].map((n) => (
                    <div key={n} className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                        <div
                            className={`h-full rounded-full bg-primary transition-all duration-500 ${step >= n ? "w-full" : "w-0"}`}
                        />
                    </div>
                ))}
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-ink-muted">Step {step} of 2</p>
        </div>
    );

    return (
        <AuthShell
            title={step === 1 ? "Create your account" : "Meet your champion"}
            subtitle={step === 1 ? "Free, and ready in under a minute. No email check." : "Who will be playing?"}
            footer={
                step === 1 ? (
                    <>
                        Already have an account?{" "}
                        <button onClick={() => router.push("/login")} className="font-bold text-primary hover:underline">
                            Log in
                        </button>
                    </>
                ) : undefined
            }
        >
            {stepper}

            {/* Step 1: Parent Info */}
            {step === 1 && (
                <form onSubmit={handleParentSubmit} className="space-y-4">
                    <Input
                        type="text"
                        label="Your name"
                        placeholder="Mrs. Mensah"
                        autoComplete="name"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        required
                    />

                    <Input
                        type="email"
                        label="Email address"
                        placeholder="you@email.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        type="password"
                        label="Password"
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />

                    <Button type="submit" variant="primary" fullWidth className="!mt-6">
                        Next
                    </Button>
                </form>
            )}

            {/* Step 2: Child Info */}
            {step === 2 && (
                <form onSubmit={handleChildSubmit} className="space-y-6">
                    <Input
                        type="text"
                        label="Child's name"
                        placeholder="Kofi"
                        autoComplete="off"
                        autoFocus
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        required
                    />

                    <div>
                        <p className="mb-2 text-sm font-semibold text-ink-soft">Choose a character</p>
                        <div className="grid grid-cols-3 gap-2">
                            {avatarOptions.map((avatar) => {
                                const selected = childAvatar === avatar;
                                return (
                                    <button
                                        key={avatar}
                                        type="button"
                                        onClick={() => setChildAvatar(avatar)}
                                        aria-pressed={selected}
                                        className={`flex flex-col items-center gap-1.5 rounded-3xl p-2.5 transition-all ${
                                            selected ? "scale-105 bg-primary/10 ring-[3px] ring-primary" : "opacity-80 ring-2 ring-ink/10 hover:opacity-100"
                                        }`}
                                    >
                                        <Avatar plate type={avatar} size="medium" />
                                        <span className="font-display text-sm font-semibold capitalize text-ink">{avatar}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-sm font-semibold text-ink-soft">Grade</p>
                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                            {gradeOptions.map((grade) => (
                                <button
                                    key={grade}
                                    type="button"
                                    onClick={() => setChildGradeLevel(grade)}
                                    aria-pressed={childGradeLevel === grade}
                                    className={`${childGradeLevel === grade ? "btn-primary" : "btn"} !min-h-[52px] !px-0 !py-2 !text-base`}
                                >
                                    {grade}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div role="alert" className="rounded-2xl bg-danger/10 p-3 text-center font-semibold text-danger-dark ring-2 ring-danger/30">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2 pt-1 sm:gap-3">
                        <Button type="button" variant="neutral" onClick={() => setStep(1)} className="flex-1">
                            Back
                        </Button>
                        <Button type="submit" variant="success" disabled={loading} className="flex-[2]">
                            {loading ? "Setting up…" : "Start playing"}
                        </Button>
                    </div>
                </form>
            )}
        </AuthShell>
    );
}
