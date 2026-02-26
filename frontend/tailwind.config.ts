import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Kid-friendly color palette
                primary: {
                    DEFAULT: "#3B82F6", // Bright blue
                    light: "#60A5FA",
                    dark: "#2563EB",
                },
                secondary: {
                    DEFAULT: "#FBBF24", // Sunny yellow
                    light: "#FCD34D",
                    dark: "#F59E0B",
                },
                success: {
                    DEFAULT: "#10B981", // Green
                    light: "#34D399",
                    dark: "#059669",
                },
                danger: {
                    DEFAULT: "#EF4444", // Red
                    light: "#F87171",
                    dark: "#DC2626",
                },
                background: {
                    DEFAULT: "#FFF9E6", // Light cream
                    dark: "#FEF3C7",
                },
                ghana: {
                    red: "#CE1126",
                    gold: "#FCD116",
                    green: "#006B3F",
                },
            },
            fontFamily: {
                playful: ['"Comic Sans MS"', '"Comic Sans"', 'cursive', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            minHeight: {
                'touch': '60px', // Minimum touch target
            },
            minWidth: {
                'touch': '60px',
            },
        },
    },
    plugins: [],
};

export default config;
