"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto">
                    <Card colorful className="animate-bounce-in">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-primary mb-2">
                                Welcome Back! 👋
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Login to continue your math adventure
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                type="email"
                                label="Parent Email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <Input
                                type="password"
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            {error && (
                                <div className="bg-danger/10 border-4 border-danger rounded-2xl p-4">
                                    <p className="text-danger font-bold text-center">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Login 🚀"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Don&apos;t have an account?{" "}
                                <button
                                    onClick={() => router.push("/register")}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Register here
                                </button>
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
