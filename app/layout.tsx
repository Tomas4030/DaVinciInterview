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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://matchworkly.com";

export const metadata: Metadata = {
  title: {
    default: "Chatbot de Entrevistas com IA para Recrutamento | MatchWorkly",
    template: "%s · MatchWorkly",
  },
  description:
    "Automatize a pré-seleção de candidatos com entrevistas em chat. O chatbot entrevista, a IA analisa respostas e gera relatórios com insights e ranking para RH.",
  keywords: [
    "chatbot entrevistas recrutamento",
    "entrevistas com IA",
    "pré seleção candidatos",
    "recrutamento automatizado",
    "software recrutamento IA",
    "triagem candidatos IA",
  ],
  authors: [{ name: "MatchWorkly" }],
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: "/pt",
    languages: {
      "pt-PT": "/pt",
      en: "/en",
      "x-default": "/en",
    },
  },
  openGraph: {
    type: "website",
    title: "Chatbot de Entrevistas com IA para Recrutamento | MatchWorkly",
    description:
      "Automatize a pré-seleção de candidatos com entrevistas em chat. O chatbot entrevista, a IA analisa respostas e gera relatórios com insights e ranking para RH.",
    url: appUrl,
    siteName: "MatchWorkly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chatbot de Entrevistas com IA para Recrutamento | MatchWorkly",
    description:
      "Automatize a pré-seleção de candidatos com entrevistas em chat. O chatbot entrevista, a IA analisa respostas e gera relatórios com insights e ranking para RH.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MatchWorkly",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${appUrl}/pt`,
  description:
    "Plataforma de entrevistas com IA que realiza pré-entrevistas em chat, analisa respostas e gera relatórios automáticos para recrutamento.",
  offers: {
    "@type": "Offer",
    price: "49",
    priceCurrency: "EUR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body
        className={`${dmSans.variable} ${dmSerifDisplay.variable} ${jetBrainsMono.variable} min-h-screen bg-[var(--c-bg)]`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ClearLegacyServiceWorker />
        {children}
      </body>
    </html>
  );
}
