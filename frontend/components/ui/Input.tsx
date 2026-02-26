/**
 * Input Component - Large, kid-friendly input field
 */
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({
    label,
    error,
    className = "",
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-lg font-bold text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <input
                className={`input ${error ? "border-danger" : ""} ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-2 text-danger text-sm font-bold animate-shake">
                    {error}
                </p>
            )}
        </div>
    );
}
