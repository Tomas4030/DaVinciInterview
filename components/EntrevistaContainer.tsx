"use client";

import { useState, useEffect } from "react";
import ChatEntrevista from "@/components/chat/ChatEntrevista";
import CandidateInfoForm from "@/components/home/CandidateInfoForm";
import type { Vaga } from "@/lib/api";

interface EntrevistaContainerProps {
  vaga: Vaga;
}

interface CandidateInfo {
  email: string;
  phone: string;
  verified: boolean;
}

export default function EntrevistaContainer({
  vaga,
}: EntrevistaContainerProps) {
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(
    null,
  );
  const [isValidatingSession, setIsValidatingSession] = useState(true);

  // Verificar se existe uma sessão válida ao montar o componente
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

        // Verificar se ainda não expirou no cliente
        if (new Date(expiresAt).getTime() <= Date.now()) {
          localStorage.removeItem(`interview_session_${vaga.id}`);
          setIsValidatingSession(false);
          return;
        }

        // Validar no backend
        const response = await fetch("/api/candidatos/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken: token,
            vagaId: vaga.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setCandidateInfo({
            email: data.email,
            phone: data.telefone,
            verified: true,
          });
        } else {
          // Sessão inválida/expirada
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
      <div className="min-h-screen bg-[var(--c-bg)] flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center">
          <p className="text-[var(--c-text)]/60">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!candidateInfo || !candidateInfo.verified) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--c-text)] mb-2">
              {vaga.titulo}
            </h1>
            <p className="text-sm text-[var(--c-text)]/60">
              Antes de começar, precisamos de validar o teu contacto
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
