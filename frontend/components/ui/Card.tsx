/**
 * Card Component - Colorful bordered card
 */
import React from "react";

interface CardProps {
    children: React.ReactNode;
    colorful?: boolean;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export default function Card({
    children,
    colorful = false,
    className = "",
    onClick,
}: CardProps) {
    return (
        <div
            className={`${colorful ? "card-colorful" : "card"} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
