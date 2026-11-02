import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import ServiceWorker from "@/components/pwa/ServiceWorker";
import InstallPrompt from "@/components/pwa/InstallPrompt";

// next/font downloads these at build time and serves them from our own origin,
// so the offline service worker can keep them. latin-ext covers Twi (ɛ, ɔ) for later.
const display = Fredoka({
    subsets: ["latin", "latin-ext"],
    variable: "--font-display",
    display: "swap",
});

const body = Nunito({
    subsets: ["latin", "latin-ext"],
    variable: "--font-body",
    display: "swap",
});

export const metadata: Metadata = {
    title: "MathChampions Ghana 🇬🇭",
    description: "Math Battle Game for Ghanaian Kids - Learn Math Through Fun Battles!",
    manifest: "/manifest.webmanifest",
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/icons/icon.svg", type: "image/svg+xml" },
        ],
        apple: "/icons/apple-touch-icon.png",
    },
    appleWebApp: {
        capable: true,
        title: "MathChampions",
        statusBarStyle: "default",
    },
    // Chrome's name for the same thing; it warns when only the Apple tag is present
    other: {
        "mobile-web-app-capable": "yes",
    },
};

export const viewport: Viewport = {
    themeColor: "#1D4ED8",
    // Lets the bottom dock sit above the iPhone home bar (env(safe-area-inset-bottom))
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${display.variable} ${body.variable}`}>
            <body>
                {children}
                <ServiceWorker />
                <InstallPrompt />
            </body>
        </html>
    );
}
