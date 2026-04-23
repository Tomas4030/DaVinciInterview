"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type InterviewOption = {
  id: string;
  title: string;
};

type Props = {
  slug: string;
  interviews: InterviewOption[];
};

export default function ResponsesFilters({ slug, interviews }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [interviewId, setInterviewId] = useState(
    searchParams.get("interviewId") || "all",
  );

  useEffect(() => {
    setQ(searchParams.get("q") || "");
    setStatus(searchParams.get("status") || "all");
    setInterviewId(searchParams.get("interviewId") || "all");
  }, [searchParams]);

  const navigate = useCallback((next: { q: string; status: string; interviewId: string }) => {
    const params = new URLSearchParams();

    if (next.q.trim()) {
      params.set("q", next.q.trim());
    }
    if (next.status && next.status !== "all") {
      params.set("status", next.status);
    }
    if (next.interviewId && next.interviewId !== "all") {
      params.set("interviewId", next.interviewId);
    }

    const query = params.toString();
    const href = query
      ? `/admin/${slug}/responses?${query}`
      : `/admin/${slug}/responses`;

    router.replace(href);
  }, [router, slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate({ q, status, interviewId });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [interviewId, navigate, q, status]);

  return (
    <div className="grid gap-3 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4 md:grid-cols-[1fr,180px,220px,auto]">
      <input
        type="text"
        name="q"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Pesquisar por candidato, telefone ou entrevista"
        className="input-base"
      />

      <select
        name="status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="input-base"
      >
        <option value="all">Todos os estados</option>
        <option value="em_progresso">Em progresso</option>
        <option value="concluida">Concluida</option>
        <option value="em_analise">Em analise</option>
        <option value="rejeitada">Rejeitada</option>
      </select>

      <select
        name="interviewId"
        value={interviewId}
        onChange={(event) => setInterviewId(event.target.value)}
        className="input-base"
      >
        <option value="all">Todas as entrevistas</option>
        {interviews.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>

      <Link
        href={`/admin/${slug}/responses/ai-comparacao`}
        className="inline-flex items-center justify-center rounded-lg bg-[var(--c-brand)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--c-brand-dark)]"
      >
        Analise com IA
      </Link>
    </div>
  );
}
