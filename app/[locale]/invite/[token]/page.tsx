import { cookies } from "next/headers";
import InviteAcceptCard from "@/components/billing/InviteAcceptCard";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string; token: string };
};

export default async function InviteAcceptPage({ params }: Props) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--c-bg)] px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[var(--c-brand)]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[260px] w-[420px] -translate-x-1/2 rounded-full bg-[var(--c-brand)]/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
      <InviteAcceptCard
        locale={params.locale}
        token={params.token}
        isAuthenticated={Boolean(session)}
      />
      </div>
    </main>
  );
}
