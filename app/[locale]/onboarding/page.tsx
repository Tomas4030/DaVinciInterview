import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OnboardingCompanyForm from "@/components/onboarding/OnboardingCompanyForm";
import GridBackgroundPattern from "@/components/ui/GridBackgroundPattern";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { resolveDefaultCompanyForUser } from "@/lib/queries/companies";

export const metadata: Metadata = { title: "Onboarding" };
export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string };
};

export default async function OnboardingPage({ params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  if (!session) {
    redirect(`/${params.locale}/admin/login?next=/${params.locale}/onboarding`);
  }

  const company = await resolveDefaultCompanyForUser(session.userId, session.email);
  if (company) {
    redirect(`/${params.locale}/admin/${company.slug}/dashboard`);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--c-bg)] px-4 py-10">
      <GridBackgroundPattern />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--c-text)]">Criar empresa</h1>
          <p className="mt-2 text-sm text-[var(--c-muted)]">
            Vamos configurar os dados base da tua organização.
          </p>
        </div>

        <OnboardingCompanyForm />
      </div>
    </main>
  );
}
