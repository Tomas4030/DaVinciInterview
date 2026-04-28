import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PlanSelection from "@/components/billing/PlanSelection";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { resolveDefaultCompanyForUser } from "@/lib/queries/companies";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string };
};

export default async function PlansPage({ params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  if (!session) {
    redirect(`/${params.locale}/signup`);
  }

  const company = await resolveDefaultCompanyForUser(session.userId, session.email);
  if (company) {
    redirect(`/${params.locale}/admin/${company.slug}/dashboard`);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[var(--c-text)]">Escolhe o teu plano</h1>
        <p className="mt-2 text-sm text-[var(--c-muted)]">
          Antes de criar a empresa, escolhe um plano para ativar a tua conta.
        </p>
      </div>
      <PlanSelection locale={params.locale} userId={session.userId} />
    </main>
  );
}
