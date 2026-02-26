"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import type { Student } from "@/lib/types";

export default function DashboardPage() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);

    useEffect(() => {
        // Load selected student
        const studentData = localStorage.getItem("selectedStudent");
        if (studentData) {
            setStudent(JSON.parse(studentData));
        } else {
            router.push("/student/select");
        }
    }, [router]);

    if (!student) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-2xl text-gray-600">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-primary mb-2">
                            Welcome, {student.name}! 🎉
                        </h2>
                        <p className="text-xl text-gray-600">
                            Ready for some math fun?
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                            colorful
                            className="text-center p-8 hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => router.push("/practice")}
                        >
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-2xl font-bold text-primary mb-2">
                                Practice Mode
                            </h3>
                            <p className="text-gray-600">
                                Practice math problems at your own pace
                            </p>
                            <p className="text-sm text-gray-500 mt-4">
                                Tap to start practicing
                            </p>
                        </Card>

                        <Card
                            colorful
                            className="text-center p-8 hover:scale-105 transition-transform cursor-pointer"
                            onClick={() =>
                                alert("Battle Mode is coming soon in Phase 3! 🚀")
                            }
                        >
                            <div className="text-6xl mb-4">⚔️</div>
                            <h3 className="text-2xl font-bold text-primary mb-2">
                                Battle Mode
                            </h3>
                            <p className="text-gray-600">
                                Challenge friends in math battles!
                            </p>
                            <p className="text-sm text-gray-500 mt-4">
                                Coming in Phase 3!
                            </p>
                        </Card>

                        <Card colorful className="text-center p-8 hover:scale-105 transition-transform cursor-pointer">
                            <div className="text-6xl mb-4">🏆</div>
                            <h3 className="text-2xl font-bold text-primary mb-2">
                                Trophies
                            </h3>
                            <p className="text-gray-600">
                                View your achievements and rewards
                            </p>
                            <p className="text-sm text-gray-500 mt-4">
                                Coming in Phase 4!
                            </p>
                        </Card>

                        <Card colorful className="text-center p-8 hover:scale-105 transition-transform cursor-pointer">
                            <div className="text-6xl mb-4">📊</div>
                            <h3 className="text-2xl font-bold text-primary mb-2">
                                Progress
                            </h3>
                            <p className="text-gray-600">
                                See how you&apos;re improving!
                            </p>
                            <p className="text-sm text-gray-500 mt-4">
                                Coming in Phase 5!
                            </p>
                        </Card>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => router.push("/student/select")}
                            className="text-primary font-bold text-lg hover:underline"
                        >
                            ← Switch Child
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
