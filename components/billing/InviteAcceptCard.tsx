"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

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
        setError(data?.error || "Nao foi possivel aceitar o convite.");
        return;
      }

      const redirectTo = data?.redirectTo || "/onboarding";
      router.push(`/${locale}${redirectTo}`);
      router.refresh();
    } catch (requestError) {
      console.error(requestError);
      setError("Erro de rede ao aceitar convite.");
    } finally {
      setLoading(false);
    }
  }

  const next = encodeURIComponent(`/${locale}/invite/${token}`);

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
      <h1 className="text-2xl font-semibold text-[var(--c-text)]">Convite para empresa</h1>
      <p className="mt-2 text-sm text-[var(--c-muted)]">
        Foste convidado para entrar numa empresa. Aceita o convite para aceder ao dashboard.
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
          className="mt-5 inline-flex rounded-lg bg-[var(--c-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--c-brand-dark)] disabled:opacity-60"
        >
          {loading ? "A aceitar..." : "Aceitar convite"}
        </button>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/admin/login?next=${next}`}
            className="inline-flex rounded-lg bg-[var(--c-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--c-brand-dark)]"
          >
            Fazer login para aceitar
          </Link>
          <Link
            href={`/${locale}/signup?next=${next}`}
            className="inline-flex rounded-lg border border-[var(--c-border)] px-5 py-2.5 text-sm font-semibold text-[var(--c-text)] hover:bg-[var(--c-bg)]"
          >
            Criar conta
          </Link>
        </div>
      )}
    </div>
  );
}
