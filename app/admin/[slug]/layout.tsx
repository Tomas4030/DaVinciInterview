import { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import AdminCompanySidebar from "@/components/admin/AdminCompanySidebar";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";

type Props = {
  children: ReactNode;
  params: { slug: string };
};

export const dynamic = "force-dynamic";

export default async function AdminCompanyLayout({ children, params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  if (!session) {
    redirect(`/admin/login?next=/admin/${params.slug}/dashboard`);
  }

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <AdminNav
        userEmail={session.email}
        companySlug={membership.company.slug}
        companyName={membership.company.name}
        companyLogoUrl={membership.company.logo_url}
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[240px,1fr]">
        <div className="space-y-3">
          <AdminCompanySidebar slug={membership.company.slug} />
          <section className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-3">
            <p className="text-xs text-[var(--c-muted)]">Empresa ativa</p>
            <p className="mt-1 text-sm font-medium text-[var(--c-text)]">
              {membership.company.name}
            </p>
            <p className="mt-1 text-xs text-[var(--c-muted)]">Role: {membership.role}</p>
          </section>
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
