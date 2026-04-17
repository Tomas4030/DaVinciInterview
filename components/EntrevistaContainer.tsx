"use client";

import { useState, useEffect } from "react";
import ChatEntrevista from "@/components/chat/ChatEntrevista";
import CandidateInfoForm from "@/components/home/CandidateInfoForm";
import type { Vaga } from "@/lib/api";
import { withBasePath } from "@/lib/base-path";

interface EntrevistaContainerProps {
  vaga: Vaga;
}

interface CandidateInfo {
  email: string;
  phone: string;
  verified: boolean;
}

function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--c-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--c-border) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          opacity: 0.5,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--c-bg)] via-transparent to-[var(--c-bg)]" />
    </div>
  );
}

export default function EntrevistaContainer({
  vaga,
}: EntrevistaContainerProps) {
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(
    null,
  );
  const [isValidatingSession, setIsValidatingSession] = useState(true);

  useEffect(() => {
    async function validateStoredSession() {
      try {
        const sessionData = localStorage.getItem(
          `interview_session_${vaga.id}`,
        );
        if (!sessionData) {
          setIsValidatingSession(false);
          return;
        }

        const { token, expiresAt } = JSON.parse(sessionData);

        if (new Date(expiresAt).getTime() <= Date.now()) {
          localStorage.removeItem(`interview_session_${vaga.id}`);
          setIsValidatingSession(false);
          return;
        }

        const response = await fetch(
          withBasePath("/api/candidatos/verify-session"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionToken: token,
              vagaId: vaga.id,
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          setCandidateInfo({
            email: data.email,
            phone: data.telefone,
            verified: true,
          });
        } else {
          localStorage.removeItem(`interview_session_${vaga.id}`);
        }
      } catch (error) {
        console.error("Erro ao validar sessão:", error);
      } finally {
        setIsValidatingSession(false);
      }
    }

    validateStoredSession();
  }, [vaga.id]);

  if (isValidatingSession) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--c-brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[var(--c-text)]/60 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!candidateInfo || !candidateInfo.verified) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] relative flex flex-col">
        <GridPattern />

        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-md animate-reveal">
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-2xl bg-[var(--c-brand)] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--c-brand)]/20">
                <span className="text-white text-3xl font-bold font-display">
                  D
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-[var(--c-text)] mb-3 text-balance">
                {vaga.titulo}
              </h1>
              <p className="text-base text-[var(--c-text)]/60 max-w-sm mx-auto">
                Antes de começares, precisamos de validar o teu contacto para
                que possas iniciar a entrevista
              </p>
            </div>

            <CandidateInfoForm
              vagaId={vaga.id}
              onSuccess={(email, phone) => {
                setCandidateInfo({
                  email,
                  phone,
                  verified: true,
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatEntrevista
      vaga={vaga}
      candidateEmail={candidateInfo.email}
      candidatePhone={candidateInfo.phone}
    />
  );
}