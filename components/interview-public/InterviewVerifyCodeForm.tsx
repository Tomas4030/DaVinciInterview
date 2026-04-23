"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

type Props = {
  slug: string;
  interviewId: string;
  email: string;
  telefone?: string;
  candidateName?: string;
};

export default function InterviewVerifyCodeForm({
  slug,
  interviewId,
  email,
  telefone,
  candidateName,
}: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Introduz o código recebido no email.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        withBasePath("/api/public/interviews/verification/verify"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug,
            interviewId,
            email,
            code: code.trim(),
            telefone,
            candidateName,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Código inválido.");
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(
          `public_interview_session_${interviewId}`,
          JSON.stringify({
            token: data.sessionToken,
            expiresAt: data.expiresAt,
            email: data.email || email,
            telefone: data.telefone || telefone || "",
            candidateName: data.candidateName || candidateName || "",
          }),
        );
      }

      router.push(`/${slug}/interview/${interviewId}/chat`);
    } catch (requestError) {
      console.error(requestError);
      setError("Erro de ligação ao servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-14">
      <h1 className="text-2xl font-semibold text-[var(--c-text)]">Verificação</h1>
      <p className="mt-2 text-sm text-[var(--c-text)]/65">
        Introduz o código enviado para <strong>{email}</strong>.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--c-text)]/70">Código</span>
          <input
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 text-sm tracking-[0.3em] outline-none focus:border-[var(--c-brand)]"
            placeholder="123456"
            required
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[var(--c-brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "A validar..." : "Validar código"}
        </button>
      </form>
    </main>
  );
}
