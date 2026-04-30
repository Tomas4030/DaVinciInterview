import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PlanSelection from "@/components/billing/PlanSelection";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { resolveDefaultCompanyForUser } from "@/lib/queries/companies";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function isTruthyParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] === "1" || value[0] === "true" || value[0] === "yes";
  }

  return value === "1" || value === "true" || value === "yes";
}

export default async function PlansPage({ params, searchParams }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  if (!session) {
    redirect(`/${params.locale}/signup`);
  }

  const company = await resolveDefaultCompanyForUser(session.userId, session.email);
  const allowManagePlans =
    isTruthyParam(searchParams?.manage) ||
    isTruthyParam(searchParams?.upgrade) ||
    isTruthyParam(searchParams?.from);

  if (company && !allowManagePlans) {
    redirect(`/${params.locale}/admin/${company.slug}/dashboard`);
  }

  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <PlanSelection locale={params.locale} userId={session.userId} />
    </main>
  );
}
