import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Chat2Work", template: "%s · DaVinci" },
  description: "Plataforma de entrevistas em formato chatbot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="min-h-screen bg-[var(--c-bg)]">
        {children}
      </body>
    </html>
  );
}
