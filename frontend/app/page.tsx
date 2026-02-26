"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to login page
        router.push("/login");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-primary mb-4">
                    MathChampions Ghana 🇬🇭
                </h1>
                <p className="text-xl text-gray-600">Loading...</p>
            </div>
        </div>
    );
}
