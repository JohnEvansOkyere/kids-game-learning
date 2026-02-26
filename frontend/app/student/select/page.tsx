"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import { studentsApi } from "@/lib/api";
import type { Student } from "@/lib/types";

export default function StudentSelectPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const loadStudents = async () => {
            try {
                const freshStudents = await studentsApi.getAll();
                setStudents(freshStudents);
                localStorage.setItem("students", JSON.stringify(freshStudents));
            } catch {
                const studentsData = localStorage.getItem("students");
                if (studentsData) {
                    setStudents(JSON.parse(studentsData));
                }
            }
        };

        loadStudents();
    }, [router]);

    const handleSelectStudent = (student: Student) => {
        // Store selected student
        localStorage.setItem("selectedStudent", JSON.stringify(student));
        // Redirect to dashboard
        router.push("/dashboard");
    };

    const handleAddChild = () => {
        router.push("/student/add");
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-primary mb-2">
                            Who&apos;s Playing Today? 🎮
                        </h2>
                        <p className="text-xl text-gray-600">
                            Select your child to start the math adventure!
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {students.map((student) => (
                            <Card
                                key={student.id}
                                colorful
                                className="cursor-pointer hover:scale-105 transition-transform animate-bounce-in"
                                onClick={() => handleSelectStudent(student)}
                            >
                                <div className="text-center">
                                    <Avatar type={student.avatar} size="large" />
                                    <h3 className="text-3xl font-bold text-primary mt-4">
                                        {student.name}
                                    </h3>
                                    <p className="text-xl text-gray-600 mt-2">
                                        Grade: {student.gradeLevel}
                                    </p>
                                    <div className="mt-4 pt-4 border-t-4 border-gray-200">
                                        <p className="text-gray-500">Tap to play!</p>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {/* Add Child Button (if less than 4 children) */}
                        {students.length < 4 && (
                            <Card
                                colorful
                                className="cursor-pointer hover:scale-105 transition-transform border-dashed"
                                onClick={handleAddChild}
                            >
                                <div className="text-center flex flex-col items-center justify-center min-h-[300px]">
                                    <div className="text-8xl mb-4">➕</div>
                                    <h3 className="text-2xl font-bold text-primary">
                                        Add Another Child
                                    </h3>
                                    <p className="text-gray-600 mt-2">
                                        You can add up to {4 - students.length} more
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
