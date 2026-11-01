import type { Config } from "tailwindcss";

/**
 * Design tokens
 *
 * Kid screens: bright scenes, chunky 3D buttons, gold = reward, green = go/correct.
 * Parent screens: the same palette, but quiet - white surfaces, ink text, lots of air.
 * Token names (primary, secondary, success, danger, background) are unchanged so
 * every existing page picks up the new look.
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
                // Brand: royal indigo
                primary: {
                    DEFAULT: "#5A44F2",
                    light: "#8B7CFF",
                    dark: "#3F2BD0",
                },
                // Reward gold: coins, stars, "play" nodes
                secondary: {
                    DEFAULT: "#FFC21A",
                    light: "#FFD85E",
                    dark: "#F29F05",
                },
                // Go / correct
                success: {
                    DEFAULT: "#22C06B",
                    light: "#5EDC96",
                    dark: "#13984F",
                },
                // Boss / wrong (kept warm, never harsh)
                danger: {
                    DEFAULT: "#FF5A4E",
                    light: "#FF8A80",
                    dark: "#E0372B",
                },
                // Warm paper
                background: {
                    DEFAULT: "#FFF8EC",
                    dark: "#FFEFD3",
                },
                // Text
                ink: {
                    DEFAULT: "#231B5C",
                    soft: "#4A4380",
                    muted: "#7B76A3",
                },
                // Dark surfaces: HUD, dock, profile lobby
                night: {
                    DEFAULT: "#1A1445",
                    light: "#2A2166",
                    deep: "#100B2E",
                },
                ghana: {
                    red: "#CE1126",
                    gold: "#FCD116",
                    green: "#006B3F",
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
                // A soft "ledge" under cards, plus a long diffuse shadow
                card: "0 4px 0 rgb(35 27 92 / 0.07), 0 18px 34px -18px rgb(35 27 92 / 0.35)",
                lift: "0 2px 0 rgb(35 27 92 / 0.06), 0 10px 24px -12px rgb(35 27 92 / 0.28)",
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
