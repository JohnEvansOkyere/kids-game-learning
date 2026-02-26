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
    type = "text",
    ...props
}: InputProps) {
    // if the input is a password field we allow toggling visibility
    const [visible, setVisible] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (visible ? "text" : "password") : type;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-lg font-bold text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={inputType}
                    className={`input ${error ? "border-danger" : ""} ${className} ${isPassword ? "pr-10" : ""}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                        onClick={() => setVisible((v) => !v)}
                    >
                        {visible ? "🙈" : "👁️"}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-2 text-danger text-sm font-bold animate-shake">
                    {error}
                </p>
            )}
        </div>
    );
}
