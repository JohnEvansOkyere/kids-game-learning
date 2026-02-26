/**
 * Header Component - Colorful header with Ghana flag
 */
import React from "react";

export default function Header() {
    return (
        <header className="bg-gradient-to-r from-primary to-primary-dark text-white py-4 px-6 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🎓</span>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        MathChampions Ghana
                    </h1>
                    <span className="text-2xl">🇬🇭</span>
                </div>
            </div>
        </header>
    );
}
