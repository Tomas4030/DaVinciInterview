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
    <main className="mx-auto max-w-6xl px-6 py-14">
      <InviteAcceptCard
        locale={params.locale}
        token={params.token}
        isAuthenticated={Boolean(session)}
      />
    </main>
  );
}
