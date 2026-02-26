"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import { studentsApi, getErrorMessage } from "@/lib/api";
import type { AvatarType, GradeLevel } from "@/lib/types";

const avatarOptions: AvatarType[] = ["lion", "elephant", "cheetah", "monkey", "eagle", "fish"];
const gradeOptions: GradeLevel[] = ["KG1", "KG2", "P1", "P2", "P3"];

export default function AddStudentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [childName, setChildName] = useState("");
    const [childAvatar, setChildAvatar] = useState<AvatarType>("lion");
    const [childGradeLevel, setChildGradeLevel] = useState<GradeLevel>("P1");
    const [childDateOfBirth, setChildDateOfBirth] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const student = await studentsApi.create({
                name: childName,
                avatar: childAvatar,
                gradeLevel: childGradeLevel,
                dateOfBirth: childDateOfBirth,
            });

            const existing = localStorage.getItem("students");
            const students = existing ? JSON.parse(existing) : [];
            localStorage.setItem("students", JSON.stringify([...students, student]));

            router.push("/student/select");
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
                    <Card colorful className="animate-bounce-in">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-primary mb-2">
                                Add Another Child 🎉
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Create a new student profile
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                    onClick={() => router.push("/student/select")}
                                    className="flex-1"
                                >
                                    ← Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? "Creating..." : "Add Child"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
