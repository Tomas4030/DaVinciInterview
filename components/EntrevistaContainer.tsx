"use client";

import { useState } from "react";
import ChatEntrevista from "@/components/chat/ChatEntrevista";
import CandidateInfoForm from "@/components/home/CandidateInfoForm";
import type { Vaga } from "@/lib/api";

interface EntrevistaContainerProps {
  vaga: Vaga;
}

export default function EntrevistaContainer({
  vaga,
}: EntrevistaContainerProps) {
  const [candidateInfo, setCandidateInfo] = useState<{
    email: string;
    phone: string;
    verified: boolean;
  } | null>(null);

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
