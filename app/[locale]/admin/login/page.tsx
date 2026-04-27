// app/admin/login/page.tsx
import { LoginForm } from "@/components/admin";
import type { Metadata } from "next";
import GridBackgroundPattern from "@/components/ui/GridBackgroundPattern";
import { tAuth } from "@/lib/i18n/auth";

type Props = {
  params: { locale: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: tAuth(params.locale, "loginPage.metaTitle"),
  };
}

export default function LoginPage({ params }: Props) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 bg-[var(--c-bg)]">
      <GridBackgroundPattern />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
            <span className="text-white text-xl font-bold font-display">D</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            {tAuth(params.locale, "loginPage.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {tAuth(params.locale, "loginPage.subtitle")}
          </p>
        </div>

        <LoginForm locale={params.locale} />
      </div>
    </main>
  );
}
