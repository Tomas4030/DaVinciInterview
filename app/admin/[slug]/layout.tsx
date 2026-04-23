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

  const membership = await getCompanyMembershipBySlug(
    session.userId,
    params.slug,
  );
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

      <div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[250px,1fr]">
          <div className="space-y-4">
            <AdminCompanySidebar slug={membership.company.slug} />

            <section className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-muted)]">
                Empresa ativa
              </p>

              <p className="mt-3 text-[15px] font-semibold text-[var(--c-text)]">
                {membership.company.name}
              </p>

              <p className="mt-2 text-sm text-[var(--c-muted)]">
                Role: {membership.role}
              </p>
            </section>

            <section className="rounded-[20px] border border-[#CFE0FF] bg-[#F5F9FF] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#B8CCFF] text-[#4F46E5]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <path d="M12 17h.01" />
                    <path d="M9.1 9a3 3 0 1 1 5.8 1c-.4.7-1.1 1.1-1.8 1.6-.7.4-1.1.9-1.1 1.9" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#3556D8]">
                    Precisa de ajuda?
                  </p>
                  <p className="mt-1 text-sm text-[var(--c-muted)]">
                    Fale com o nosso suporte
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-[#D6DDF3] bg-white px-4 py-3 text-sm font-medium text-[#3556D8] transition hover:bg-[#F8FAFF]"
              >
                Contactar suporte
              </button>
            </section>
          </div>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
