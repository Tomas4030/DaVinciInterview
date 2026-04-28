"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { tAuth } from "@/lib/i18n/auth";

type Props = {
  locale: string;
  token: string;
  isAuthenticated: boolean;
};

export default function InviteAcceptCard({ locale, token, isAuthenticated }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function acceptInvite() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(withBasePath("/api/invites/accept"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || tAuth(locale, "invite.acceptError"));
        return;
      }

      const redirectTo = data?.redirectTo || "/onboarding";
      router.push(`/${locale}${redirectTo}`);
      router.refresh();
    } catch (requestError) {
      console.error(requestError);
      setError(tAuth(locale, "invite.networkError"));
    } finally {
      setLoading(false);
    }
  }

  const next = encodeURIComponent(`/${locale}/invite/${token}`);

  return (
    <section className="mx-auto w-full rounded-3xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:p-9">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--c-brand)]/10 text-[var(--c-brand)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-6 w-6">
          <path d="M7 10h10" />
          <path d="M7 14h6" />
          <rect x="3" y="4" width="18" height="16" rx="3" />
        </svg>
      </div>

      <h1 className="text-center text-2xl font-semibold text-[var(--c-text)] sm:text-3xl">
        {tAuth(locale, "invite.title")}
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed text-[var(--c-muted)] sm:text-[0.95rem]">
        {tAuth(locale, "invite.description")}
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isAuthenticated ? (
        <button
          type="button"
          onClick={acceptInvite}
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[var(--c-brand)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--c-brand-dark)] disabled:opacity-60"
        >
          {loading ? tAuth(locale, "invite.accepting") : tAuth(locale, "invite.acceptAction")}
        </button>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/${locale}/admin/login?next=${next}`}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--c-brand)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--c-brand-dark)]"
          >
            {tAuth(locale, "invite.loginAction")}
          </Link>
          <Link
            href={`/${locale}/signup?next=${next}`}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--c-border)] px-5 py-3 text-sm font-semibold text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg)]"
          >
            {tAuth(locale, "invite.signupAction")}
          </Link>
        </div>
      )}
    </section>
  );
}
