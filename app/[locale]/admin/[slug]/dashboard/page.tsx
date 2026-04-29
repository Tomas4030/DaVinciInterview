import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { tAdmin } from "@/lib/i18n/admin";
import { extractInterviewCardEmojiFromDescription } from "@/lib/interview-meta";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { listInterviewsByCompany } from "@/lib/queries/interviews";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string; slug: string };
};

type IconName = "chat" | "send" | "check" | "briefcase" | "file";

function TinyLine({ color }: { color: "blue" | "green" | "orange" }) {
  const stroke =
    color === "blue" ? "#6366f1" : color === "green" ? "#22c55e" : "#f97316";

  return (
    <svg viewBox="0 0 160 38" className="h-9 w-full" fill="none" aria-hidden>
      <path
        d="M4 28 C 20 24, 26 14, 42 18 C 58 22, 66 10, 82 12 C 100 14, 106 26, 124 24 C 138 22, 146 28, 156 30"
        stroke={stroke}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Icon({
  name,
  className = "h-6 w-6",
}: {
  name: IconName;
  className?: string;
}) {
  if (name === "chat") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M7 8h10M7 12h6M6 18l-3 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "send") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="m22 2-7 20-4-9-9-4 20-7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6 9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "briefcase") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm0 0h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M8 3h6l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  description: string;
  icon: IconName;
  tone: "blue" | "green" | "orange";
}) {
  const styles = {
    blue: {
      box: "bg-indigo-50 text-indigo-600",
      line: "blue" as const,
    },
    green: {
      box: "bg-emerald-50 text-emerald-600",
      line: "green" as const,
    },
    orange: {
      box: "bg-orange-50 text-orange-600",
      line: "orange" as const,
    },
  }[tone];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${styles.box}`}
      >
        <Icon name={icon} />
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-slate-950">
        {value}
      </p>

      <p className="mt-3 text-sm font-medium text-slate-500">{description}</p>

      <div className="mt-4 opacity-90">
        <TinyLine color={styles.line} />
      </div>
    </article>
  );
}

function timeAgo(dateValue?: string | Date | null) {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  const diff = Date.now() - date.getTime();

  if (!Number.isFinite(diff)) return null;

  const days = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));

  if (days === 1) return { unit: "day", value: 1 } as const;
  if (days < 7) return { unit: "days", value: days } as const;
  if (days < 30) return { unit: "weeks", value: Math.floor(days / 7) } as const;

  return { unit: "months", value: Math.floor(days / 30) } as const;
}

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: tAdmin(params.locale, "dashboardPage.metaTitle"),
  };
}

export default async function AdminCompanyDashboardPage({ params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  if (!session) {
    notFound();
  }

  let membership: Awaited<ReturnType<typeof getCompanyMembershipBySlug>> = null;

  try {
    membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  } catch (error) {
    console.error("[dashboard] Falha ao carregar membership", {
      slug: params.slug,
      userId: session.userId,
      error,
    });
    notFound();
  }

  if (!membership) {
    notFound();
  }

  let interviews: Awaited<ReturnType<typeof listInterviewsByCompany>> = [];

  try {
    interviews = await listInterviewsByCompany(membership.company.id);
  } catch (error) {
    console.error("[dashboard] Falha ao listar entrevistas", {
      companyId: membership.company.id,
      error,
    });
  }

  let totalResponses = 0;
  let totalCompleted = 0;

  try {
    const [responseRows] = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM candidato_respostas WHERE company_id = ?`,
      [membership.company.id],
    );

    totalResponses = Number(responseRows[0]?.total || 0);
  } catch (error) {
    console.warn("[dashboard] Nao foi possivel contar respostas totais", error);
  }

  try {
    const [completionRows] = await query<{ completed: number }>(
      `SELECT COUNT(*) as completed FROM candidato_respostas WHERE company_id = ? AND status = 'concluida'`,
      [membership.company.id],
    );

    totalCompleted = Number(completionRows[0]?.completed || 0);
  } catch (error) {
    console.warn(
      "[dashboard] Nao foi possivel contar respostas concluidas",
      error,
    );
  }

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const interviewTimestamps = interviews
    .map((item: any) => {
      const rawDate = item?.created_at || item?.criada_em || item?.updated_at;
      const timestamp = rawDate ? new Date(rawDate).getTime() : NaN;
      return Number.isFinite(timestamp) ? timestamp : null;
    })
    .filter((timestamp): timestamp is number => timestamp !== null);

  const totalPublished = interviews.filter(
    (item) => item.status === "published",
  ).length;

  const interviewsWeek = interviewTimestamps.filter(
    (ts) => ts >= weekAgo,
  ).length;
  const interviewsMonth = interviewTimestamps.filter(
    (ts) => ts >= monthAgo,
  ).length;

  const completionRate =
    totalResponses > 0
      ? Math.round((totalCompleted / totalResponses) * 100)
      : 0;

  const recentInterviews = interviews.slice(0, 5);

  return (
    <section className="space-y-6 pb-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
          {tAdmin(params.locale, "dashboardPage.eyebrow")}
        </p>

        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-4xl">
            {membership.company.name}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {tAdmin(params.locale, "dashboardPage.welcome")}
          </p>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label={tAdmin(params.locale, "dashboardStats.interviews")}
          value={interviews.length}
          description={tAdmin(params.locale, "dashboardStats.period", {
            week: interviewsWeek,
            month: interviewsMonth,
          })}
          icon="chat"
          tone="blue"
        />

        <MetricCard
          label={tAdmin(params.locale, "dashboardStats.published")}
          value={totalPublished}
          description={tAdmin(params.locale, "dashboardStats.totalPublished")}
          icon="send"
          tone="green"
        />

        <MetricCard
          label={tAdmin(params.locale, "dashboardStats.responses")}
          value={totalResponses}
          description={tAdmin(params.locale, "dashboardStats.completionRate", {
            rate: completionRate,
          })}
          icon="check"
          tone="orange"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
            {tAdmin(params.locale, "recentInterviews.title")}
          </h2>

          <a
            href={`/${params.locale}/admin/${params.slug}/interviews`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {tAdmin(params.locale, "recentInterviews.viewAll")}
            <span aria-hidden>›</span>
          </a>
        </div>

        {recentInterviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                {tAdmin(params.locale, "recentInterviews.empty")}
              </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentInterviews.map((item: any) => {
              const emoji =
                String(item?.card_emoji || "").trim() ||
                extractInterviewCardEmojiFromDescription(item?.description);

              const updatedAt =
                item?.updated_at || item?.created_at || item?.criada_em;

              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-slate-50 text-2xl">
                      <span aria-hidden>{emoji}</span>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {tAdmin(params.locale, "recentInterviews.createdByYou")} • {(() => {
                          const relative = timeAgo(updatedAt);
                          if (!relative) return tAdmin(params.locale, "recentInterviews.updatedRecently");
                          if (relative.unit === "day") {
                            return tAdmin(params.locale, "recentInterviews.updatedDays", {
                              count: relative.value,
                            });
                          }
                          if (relative.unit === "days") {
                            return tAdmin(params.locale, "recentInterviews.updatedDays", {
                              count: relative.value,
                            });
                          }
                          if (relative.unit === "weeks") {
                            return tAdmin(params.locale, "recentInterviews.updatedWeeks", {
                              count: relative.value,
                            });
                          }
                          return tAdmin(params.locale, "recentInterviews.updatedMonths", {
                            count: relative.value,
                          });
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:justify-end">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold lowercase text-emerald-600">
                      {item.status === "published"
                        ? tAdmin(params.locale, "interviews.filters.statusPublished")
                        : item.status === "draft"
                          ? tAdmin(params.locale, "interviews.filters.statusDraft")
                          : item.status === "archived"
                            ? tAdmin(params.locale, "interviews.filters.statusArchived")
                            : item.status}
                    </span>

                    <a
                      href={`/${params.locale}/admin/${params.slug}/responses?interviewId=${item.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {tAdmin(params.locale, "recentInterviews.viewResponses")}
                      <span aria-hidden>›</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-6 shadow-[0_10px_30px_rgba(79,70,229,0.08)]">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">
              {tAdmin(params.locale, "dashboardPromo.eyebrow")}
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              {tAdmin(params.locale, "dashboardPromo.title")}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              {tAdmin(params.locale, "dashboardPromo.description")}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                tAdmin(params.locale, "dashboardPromo.feature1"),
                tAdmin(params.locale, "dashboardPromo.feature2"),
                tAdmin(params.locale, "dashboardPromo.feature3"),
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600"
                >
                  {feature}
                </div>
              ))}
            </div>

            <a
              href={`/${params.locale}/admin/${params.slug}/billing`}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,70,229,0.24)] hover:bg-indigo-700"
            >
              {tAdmin(params.locale, "dashboardPromo.action")}
            </a>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-full bg-violet-200/30 blur-3xl" />
            <div className="relative rounded-[28px] border border-violet-100 bg-white p-5 shadow-[0_24px_80px_rgba(79,70,229,0.16)]">
              <div className="mb-5 h-4 w-24 rounded-full bg-violet-200" />
              <TinyLine color="blue" />
              <div className="mt-5 grid gap-3">
                <div className="h-3 rounded-full bg-slate-100" />
                <div className="h-3 w-4/5 rounded-full bg-slate-100" />
                <div className="h-3 w-2/3 rounded-full bg-slate-100" />
              </div>

              <div className="absolute -right-5 -top-5 flex h-20 w-20 items-center justify-center rounded-full border border-violet-100 bg-white text-xl font-bold text-indigo-600 shadow-xl">
                95%
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
