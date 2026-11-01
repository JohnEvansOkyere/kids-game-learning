"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/layout/AuthShell";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { authApi, getErrorMessage } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await authApi.login({ email, password });

            // Store user data
            localStorage.setItem("user", JSON.stringify(response.user));
            localStorage.setItem("parent", JSON.stringify(response.parent));
            localStorage.setItem("students", JSON.stringify(response.students));

            // Redirect to parent dashboard
            router.push("/parent/dashboard");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Log in to see how your child is doing."
            footer={
                <>
                    New to MathChampions?{" "}
                    <button onClick={() => router.push("/register")} className="font-bold text-primary hover:underline">
                        Create an account
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    type="email"
                    label="Parent email"
                    placeholder="you@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <Input
                    type="password"
                    label="Password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && (
                    <div role="alert" className="rounded-2xl bg-danger/10 p-3 text-center font-semibold text-danger-dark ring-2 ring-danger/30">
                        {error}
                    </div>
                )}

                <Button type="submit" variant="primary" fullWidth disabled={loading} className="!mt-6">
                    {loading ? "Logging in…" : "Log in"}
                </Button>
            </form>
        </AuthShell>
    );
}
