/**
 * Button Component - Kid-friendly, touch-optimized button
 */
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "success" | "danger";
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
