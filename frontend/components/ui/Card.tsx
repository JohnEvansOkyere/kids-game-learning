/**
 * Card Component - Colorful bordered card
 */
import React from "react";

interface CardProps {
    children: React.ReactNode;
    colorful?: boolean;
    className?: string;
}

export default function Card({
    children,
    colorful = false,
    className = "",
}: CardProps) {
    return (
        <div className={`${colorful ? "card-colorful" : "card"} ${className}`}>
            {children}
        </div>
    );
}
