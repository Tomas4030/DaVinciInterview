"use client";

import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

export default function SuperAdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch(withBasePath("/api/super-admin/auth/logout"), {
      method: "POST",
    });
    router.push("/super-admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-[var(--c-border)] px-3 py-2 text-xs font-medium text-[var(--c-text)] hover:bg-[var(--c-bg)]"
    >
      Logout
    </button>
  );
}
