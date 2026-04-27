import type { Metadata } from "next";
import { SignupForm } from "@/components/admin";
import GridBackgroundPattern from "@/components/ui/GridBackgroundPattern";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 bg-[var(--c-bg)]">
      <GridBackgroundPattern />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
            <span className="text-white text-xl font-bold font-display">D</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">
            Regista-te para criar a tua empresa
          </p>
        </div>

        <SignupForm />
      </div>
    </main>
  );
}
