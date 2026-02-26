"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import { authApi, getErrorMessage } from "@/lib/api";
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
    const [phoneNumber, setPhoneNumber] = useState("");

    // Child info
    const [childName, setChildName] = useState("");
    const [childAvatar, setChildAvatar] = useState<AvatarType>("lion");
    const [childGradeLevel, setChildGradeLevel] = useState<GradeLevel>("P1");
    const [childDateOfBirth, setChildDateOfBirth] = useState("");

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
            const response = await authApi.register({
                email,
                password,
                parentName,
                phoneNumber,
                childName,
                childAvatar,
                childGradeLevel,
                childDateOfBirth,
            });

            // Store user data
            localStorage.setItem("user", JSON.stringify(response.user));
            localStorage.setItem("parent", JSON.stringify(response.parent));
            localStorage.setItem("students", JSON.stringify([response.student]));

            // Redirect to dashboard
            router.push("/dashboard");
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
                <div className="max-w-2xl mx-auto">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="flex items-center gap-4">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${step >= 1 ? "bg-primary text-white" : "bg-gray-300 text-gray-600"
                                    }`}
                            >
                                1
                            </div>
                            <div className="w-16 h-1 bg-gray-300">
                                <div
                                    className={`h-full transition-all duration-300 ${step >= 2 ? "bg-primary w-full" : "w-0"
                                        }`}
                                />
                            </div>
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${step >= 2 ? "bg-primary text-white" : "bg-gray-300 text-gray-600"
                                    }`}
                            >
                                2
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Parent Info */}
                    {step === 1 && (
                        <Card colorful className="animate-bounce-in">
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-bold text-primary mb-2">
                                    Create Parent Account 👨‍👩‍👧‍👦
                                </h2>
                                <p className="text-gray-600 text-lg">
                                    Let&apos;s start with your information
                                </p>
                            </div>

                            <form onSubmit={handleParentSubmit} className="space-y-4">
                                <Input
                                    type="text"
                                    label="Your Name"
                                    placeholder="Mrs. Mensah"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                    required
                                />

                                <Input
                                    type="email"
                                    label="Email Address"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <Input
                                    type="tel"
                                    label="Phone Number (Ghana)"
                                    placeholder="+233241234567"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />

                                <Input
                                    type="password"
                                    label="Password"
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />

                                <Button type="submit" variant="primary" fullWidth>
                                    Next: Add Your Child →
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-gray-600">
                                    Already have an account?{" "}
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="text-primary font-bold hover:underline"
                                    >
                                        Login here
                                    </button>
                                </p>
                            </div>
                        </Card>
                    )}

                    {/* Step 2: Child Info */}
                    {step === 2 && (
                        <Card colorful className="animate-bounce-in">
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-bold text-primary mb-2">
                                    Add Your Child 🎉
                                </h2>
                                <p className="text-gray-600 text-lg">
                                    Tell us about your little champion!
                                </p>
                            </div>

                            <form onSubmit={handleChildSubmit} className="space-y-6">
                                <Input
                                    type="text"
                                    label="Child's Name"
                                    placeholder="Kofi"
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    required
                                />

                                <div>
                                    <label className="block text-lg font-bold text-gray-700 mb-3">
                                        Choose Avatar
                                    </label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {avatarOptions.map((avatar) => (
                                            <button
                                                key={avatar}
                                                type="button"
                                                onClick={() => setChildAvatar(avatar)}
                                                className={`card p-4 hover:scale-105 transition-transform ${childAvatar === avatar
                                                        ? "border-primary border-8 animate-pulse-glow"
                                                        : "border-gray-300"
                                                    }`}
                                            >
                                                <Avatar type={avatar} size="medium" />
                                                <p className="text-sm font-bold mt-2 capitalize">
                                                    {avatar}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-lg font-bold text-gray-700 mb-3">
                                        Grade Level
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {gradeOptions.map((grade) => (
                                            <button
                                                key={grade}
                                                type="button"
                                                onClick={() => setChildGradeLevel(grade)}
                                                className={`btn ${childGradeLevel === grade
                                                        ? "btn-primary"
                                                        : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                {grade}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Input
                                    type="date"
                                    label="Date of Birth"
                                    value={childDateOfBirth}
                                    onChange={(e) => setChildDateOfBirth(e.target.value)}
                                    required
                                />

                                {error && (
                                    <div className="bg-danger/10 border-4 border-danger rounded-2xl p-4">
                                        <p className="text-danger font-bold text-center">{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setStep(1)}
                                        className="flex-1"
                                    >
                                        ← Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        {loading ? "Creating..." : "Create Account 🚀"}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
