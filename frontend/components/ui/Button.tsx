/**
 * Button Component - chunky 3D key, touch-optimized
 */
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    // "neutral" is a white key for secondary actions and answer tiles
    variant?: "primary" | "secondary" | "success" | "danger" | "neutral";
    children: React.ReactNode;
    fullWidth?: boolean;
}

export default function Button({
    variant = "primary",
    children,
    fullWidth = false,
    className = "",
    ...props
}: ButtonProps) {
    const variantClasses = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        success: "btn-success",
        danger: "btn-danger",
        neutral: "btn",
    };

    return (
        <button
            className={`${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
