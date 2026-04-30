import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GridBackgroundPattern from "@/components/ui/GridBackgroundPattern";
import SuperAdminLoginForm from "@/components/super-admin/SuperAdminLoginForm";
import {
  SUPER_ADMIN_SESSION_COOKIE,
  parseSuperAdminToken,
} from "@/lib/super-admin-auth";

export const metadata: Metadata = {
  title: "Super Admin Login",
};

export default function SuperAdminLoginPage() {
  const token = cookies().get(SUPER_ADMIN_SESSION_COOKIE)?.value;
  const session = parseSuperAdminToken(token);

  if (session) {
    redirect("/super-admin");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--c-bg)] px-4">
      <GridBackgroundPattern />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 shadow-lg shadow-brand-200">
            <span className="font-display text-xl font-bold text-white">S</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Super Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Acesso reservado para gestão global da plataforma</p>
        </div>

        <SuperAdminLoginForm />
      </div>
    </main>
  );
}
