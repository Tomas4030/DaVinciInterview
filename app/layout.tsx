import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClearLegacyServiceWorker from "@/components/ClearLegacyServiceWorker";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-dm-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-dm-serif-display",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: { default: "MatchWorky", template: "%s · MatchWorky" },
  description: "Plataforma de entrevistas em formato chatbot",
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    title: "MatchWorky",
    description: "Plataforma de entrevistas em formato chatbot",
    url: appUrl,
    siteName: "MatchWorky",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchWorky",
    description: "Plataforma de entrevistas em formato chatbot",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${dmSerifDisplay.variable} ${jetBrainsMono.variable} min-h-screen bg-[var(--c-bg)]`}
      >
        <ClearLegacyServiceWorker />
        {children}
      </body>
    </html>
  );
}
