import { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminCompanySidebar, AdminNav } from "@/components/admin";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { tAdmin } from "@/lib/i18n/admin";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { countPublishedInterviewsByCompany } from "@/lib/queries/interviews";

type Props = {
  children: ReactNode;
  params: { locale: string; slug: string };
};

export const dynamic = "force-dynamic";

export default async function AdminCompanyLayout({ children, params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  if (!session) {
    redirect(
      `/${params.locale}/admin/login?next=/${params.locale}/admin/${params.slug}/dashboard`,
    );
  }

  let membership: Awaited<ReturnType<typeof getCompanyMembershipBySlug>> = null;
  try {
    membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  } catch (error) {
    console.error("[admin layout] Falha ao carregar membership", {
      slug: params.slug,
      userId: session.userId,
      error,
    });
    notFound();
  }

  if (!membership) {
    notFound();
  }

  const activeInterviews = await countPublishedInterviewsByCompany(
    membership.company.id,
  );
  const roleCanManageBilling =
    membership.role === "owner" || membership.role === "admin";
  const plan = membership.company.plan || "free";
  const hasPlan = plan !== "free";
  const planName =
    plan === "basic"
      ? tAdmin(params.locale, "layout.planBasic")
      : plan === "pro"
        ? tAdmin(params.locale, "layout.planPro")
        : tAdmin(params.locale, "layout.planFree");
  const interviewsLimit =
    plan === "free" ? 1 : plan === "basic" ? 5 : null;
  const usageLabel = interviewsLimit
    ? tAdmin(params.locale, "layout.activeInterviewsLimited", {
        active: activeInterviews,
        limit: interviewsLimit,
      })
    : tAdmin(params.locale, "layout.activeInterviewsUnlimited", {
        active: activeInterviews,
      });

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <AdminNav
        userEmail={session.email}
        companySlug={membership.company.slug}
        companyName={membership.company.name}
        companyLogoUrl={membership.company.logo_url}
        locale={params.locale}
      />

      <div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[250px,1fr]">
          <div className="space-y-4">
            <AdminCompanySidebar
              slug={membership.company.slug}
              locale={params.locale}
              role={membership.role}
            />

            <section className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-muted)]">
                  {tAdmin(params.locale, "layout.activeCompany")}
                </p>

              <p className="mt-3 text-[15px] font-semibold text-[var(--c-text)]">
                {membership.company.name}
              </p>

              <p className="mt-2 text-sm text-[var(--c-muted)]">
                {tAdmin(params.locale, "layout.roleLabel")}: {membership.role}
              </p>

              <div className="mt-3 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-bg)]/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--c-muted)]">
                  {tAdmin(params.locale, "layout.planLabel")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--c-text)]">
                  {hasPlan ? planName : tAdmin(params.locale, "layout.planNone")}
                </p>
                <p className="mt-1 text-xs text-[var(--c-muted)]">{usageLabel}</p>
                <p className="mt-1 text-xs text-[var(--c-muted)]">
                  {tAdmin(params.locale, "layout.planState")}: {hasPlan
                    ? tAdmin(params.locale, "layout.planActive")
                    : tAdmin(params.locale, "layout.planMissing")}
                </p>

                {roleCanManageBilling ? (
                  <div className="mt-3 flex gap-2">
                    {!hasPlan ? (
                      <a
                        href={`/${params.locale}/plans?manage=1`}
                        className="inline-flex rounded-lg bg-[var(--c-brand)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--c-brand-dark)]"
                        >
                          {tAdmin(params.locale, "layout.choosePlan")}
                        </a>
                    ) : (
                      <>
                        <a
                          href={`/${params.locale}/plans?manage=1`}
                          className="inline-flex rounded-lg bg-[var(--c-brand)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--c-brand-dark)]"
                        >
                          {tAdmin(params.locale, "layout.upgrade")}
                        </a>
                        <a
                          href={`/${params.locale}/admin/${membership.company.slug}/billing`}
                          className="inline-flex rounded-lg border border-[var(--c-border)] px-3 py-2 text-xs font-semibold text-[var(--c-text)] hover:bg-[var(--c-bg)]"
                        >
                          {tAdmin(params.locale, "layout.managePlan")}
                        </a>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
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
                    {tAdmin(params.locale, "layout.helpTitle")}
                  </p>
                  <p className="mt-1 text-sm text-[var(--c-muted)]">
                    {tAdmin(params.locale, "layout.helpSubtitle")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-[#D6DDF3] bg-white px-4 py-3 text-sm font-medium text-[#3556D8] transition hover:bg-[#F8FAFF]"
              >
                {tAdmin(params.locale, "layout.helpAction")}
              </button>
            </section>
          </div>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
