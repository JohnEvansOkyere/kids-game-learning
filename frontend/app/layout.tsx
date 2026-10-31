import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorker from "@/components/pwa/ServiceWorker";

export const metadata: Metadata = {
    title: "MathChampions Ghana 🇬🇭",
    description: "Math Battle Game for Ghanaian Kids - Learn Math Through Fun Battles!",
    manifest: "/manifest.webmanifest",
    icons: {
        icon: "/favicon.ico",
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
    themeColor: "#3B82F6",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                {children}
                <ServiceWorker />
            </body>
        </html>
    );
}
