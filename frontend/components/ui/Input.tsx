/**
 * Input Component - large, calm input field with a proper label
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
    id,
    ...props
}: InputProps) {
    // if the input is a password field we allow toggling visibility
    const [visible, setVisible] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const isPassword = type === "password";
    const inputType = isPassword ? (visible ? "text" : "password") : type;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-semibold text-ink-soft mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    id={inputId}
                    type={inputType}
                    className={`input ${error ? "border-danger" : ""} ${className} ${isPassword ? "pr-16" : ""}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-4 flex items-center text-sm font-semibold text-primary"
                        onClick={() => setVisible((v) => !v)}
                        aria-label={visible ? "Hide password" : "Show password"}
                    >
                        {visible ? "Hide" : "Show"}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-2 text-danger-dark text-sm font-semibold animate-shake">
                    {error}
                </p>
            )}
        </div>
    );
}
