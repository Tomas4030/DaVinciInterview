import Link from "next/link";
import SuperAdminLogoutButton from "@/components/super-admin/SuperAdminLogoutButton";

type Props = {
  email: string;
};

export default function SuperAdminNav({ email }: Props) {
  return (
    <header className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Super Admin</p>
          <p className="text-sm text-gray-700">{email}</p>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/super-admin" className="rounded-lg px-3 py-2 hover:bg-[var(--c-bg)]">
            Overview
          </Link>
          <Link href="/super-admin/companies" className="rounded-lg px-3 py-2 hover:bg-[var(--c-bg)]">
            Companies
          </Link>
          <Link href="/super-admin/ai-usage" className="rounded-lg px-3 py-2 hover:bg-[var(--c-bg)]">
            AI Usage
          </Link>
          <Link href="/super-admin/admins" className="rounded-lg px-3 py-2 hover:bg-[var(--c-bg)]">
            Admins
          </Link>
          <SuperAdminLogoutButton />
        </nav>
      </div>
    </header>
  );
}
