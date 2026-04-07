"use client";

import { useState } from "react";
import {
  isValidEmail,
  isValidPhoneNumber,
  formatPhoneNumber,
} from "@/lib/validation";

interface CandidateInfoFormProps {
  vagaId: string;
  onSuccess: (email: string, phone: string) => void;
  isLoading?: boolean;
}

export default function CandidateInfoForm({
  vagaId,
  onSuccess,
  isLoading = false,
}: CandidateInfoFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors and warnings
    setErrors({});
    setDuplicateWarning(null);

    // Validação
    const newErrors: { email?: string; phone?: string } = {};

    if (!isValidEmail(email)) {
      newErrors.email = "Email inválido";
    }

    if (!isValidPhoneNumber(phone)) {
      newErrors.phone = "Número de telemóvel inválido (ex: 91 234 5678)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Verificar se já existe candidatura
    setIsChecking(true);
    try {
      const response = await fetch("/api/candidatos/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          telefone: formatPhoneNumber(phone),
          vaga_id: vagaId,
        }),
      });

      const data = await response.json();

      if (data.exists) {
        setDuplicateWarning(data.message);
        return;
      }

      // Se não existe, enviar email de verificação
      const verifyResponse = await fetch("/api/candidatos/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!verifyResponse.ok) {
        setErrors({ email: "Erro ao enviar email de verificação" });
        return;
      }

      onSuccess(email, formatPhoneNumber(phone));
    } catch (error) {
      console.error("Erro ao verificar candidatura:", error);
      setErrors({ email: "Erro ao processar candidatura" });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--c-text)] mb-2"
          >
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="teu@email.com"
            className="w-full px-3 py-2 rounded-lg border border-[var(--c-border)]/80 bg-[var(--c-surface)] text-[var(--c-text)] placeholder-[var(--c-text)]/50 transition-colors duration-200 focus:outline-none focus:border-[var(--c-brand)]/60 focus:ring-1 focus:ring-[var(--c-brand)]/30"
            required
            disabled={isLoading || isChecking}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-[var(--c-text)] mb-2"
          >
            Telemóvel *
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            placeholder="91 234 5678"
            className="w-full px-3 py-2 rounded-lg border border-[var(--c-border)]/80 bg-[var(--c-surface)] text-[var(--c-text)] placeholder-[var(--c-text)]/50 transition-colors duration-200 focus:outline-none focus:border-[var(--c-brand)]/60 focus:ring-1 focus:ring-[var(--c-brand)]/30"
            required
            disabled={isLoading || isChecking}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        {duplicateWarning && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800 font-medium">
              {duplicateWarning}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Podes candidatar-te a outras vagas ou aguardar feedback da nossa
              equipa.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isChecking || !!duplicateWarning}
          className="w-full px-4 py-2.5 rounded-lg bg-[var(--c-brand)] text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:shadow-lg"
        >
          {isChecking ? "A verificar..." : "Continuar"}
        </button>

        <p className="text-xs text-[var(--c-text)]/50 text-center">
          Vamos enviar um email de verificação para confirmar o teu email.
        </p>
      </form>
    </div>
  );
}
