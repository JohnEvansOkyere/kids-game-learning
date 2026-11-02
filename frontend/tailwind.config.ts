import type { Config } from "tailwindcss";

/**
 * Design tokens
 *
 * Three colours only: blue (#1D4ED8), white, and yellow (#FFC21A) for accents and
 * text on blue. Every surface is flat blue or flat white - no gradients, no second
 * shade of blue. Token names (primary, secondary, success, danger, night, background)
 * are unchanged so every existing page picks up the palette.
 */
const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // One flat blue. light/dark are deliberately identical so a gradient
                // or hover shade never introduces a second, brighter or deeper blue.
                primary: {
                    DEFAULT: "#1D4ED8",
                    light: "#1D4ED8",
                    dark: "#1D4ED8",
                },
                // The only accent: yellow (stars, coins, highlights, text on blue)
                secondary: {
                    DEFAULT: "#FFC21A",
                    light: "#FFC21A",
                    dark: "#FFC21A",
                },
                // Palette is blue / white / yellow only. "Go / correct" is the brand blue.
                success: {
                    DEFAULT: "#1D4ED8",
                    light: "#1D4ED8",
                    dark: "#1D4ED8",
                },
                // "Wrong / try again" is yellow (shown with an icon and text, not colour alone).
                // danger-dark is the navy ink used for text sitting on a yellow tint.
                danger: {
                    DEFAULT: "#FFC21A",
                    light: "#FFC21A",
                    dark: "#102A6B",
                },
                // Surfaces are white or blue, nothing in between
                background: {
                    DEFAULT: "#FFFFFF",
                    dark: "#FFFFFF",
                },
                // Text on white: blue-navy
                ink: {
                    DEFAULT: "#102A6B",
                    soft: "#2B4690",
                    muted: "#5A6FA8",
                },
                // Dark surfaces (HUD, dock, brand panel) are simply the brand blue
                night: {
                    DEFAULT: "#1D4ED8",
                    light: "#1D4ED8",
                    deep: "#1D4ED8",
                },
            },
            fontFamily: {
                // Fredoka: rounded, chunky - headings, buttons, numbers
                display: ["var(--font-display)", "ui-rounded", '"SF Pro Rounded"', "system-ui", "sans-serif"],
                // Nunito: rounded, very readable - body copy
                body: ["var(--font-body)", "ui-rounded", "system-ui", "sans-serif"],
                // Old name, still used in a few places
                playful: ["var(--font-body)", "ui-rounded", "system-ui", "sans-serif"],
            },
            borderRadius: {
                "2xl": "1rem",
                "3xl": "1.5rem",
                "4xl": "2rem",
            },
            boxShadow: {
                // Soft diffuse shadows only; no coloured ledge
                card: "0 1px 2px rgb(16 42 107 / 0.06), 0 12px 28px -14px rgb(16 42 107 / 0.28)",
                lift: "0 1px 2px rgb(16 42 107 / 0.05), 0 8px 20px -12px rgb(16 42 107 / 0.24)",
            },
            minHeight: {
                touch: "60px", // Minimum touch target
            },
            minWidth: {
                touch: "60px",
            },
        },
    },
    plugins: [],
};

export default config;
