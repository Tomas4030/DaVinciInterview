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
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "code">("form");

  const [errors, setErrors] = useState<{
    email?: string;
    phone?: string;
    code?: string;
    general?: string;
  }>({});

  const [isChecking, setIsChecking] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = formatPhoneNumber(phone);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();

    setErrors({});
    setDuplicateWarning(null);
    setSuccessMessage(null);

    const newErrors: {
      email?: string;
      phone?: string;
    } = {};

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

    try {
      setIsChecking(true);

      const checkResponse = await fetch("/api/candidatos/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          telefone: normalizedPhone,
          vaga_id: vagaId,
        }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        setErrors({
          general: checkData?.error || "Erro ao verificar candidatura",
        });
        return;
      }

      if (checkData.exists) {
        setDuplicateWarning(
          checkData.message || "Já existe uma candidatura com estes dados.",
        );
        return;
      }

      setIsSendingCode(true);

      const sendCodeResponse = await fetch("/api/candidatos/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          telefone: normalizedPhone,
          vaga_id: vagaId,
        }),
      });

      const sendCodeData = await sendCodeResponse.json();

      if (!sendCodeResponse.ok) {
        setErrors({
          general: sendCodeData?.error || "Erro ao enviar email com código",
        });
        return;
      }

      setSuccessMessage("Enviámos um código para o teu email.");
      setStep("code");
    } catch (error) {
      console.error("Erro ao enviar código:", error);
      setErrors({
        general: "Erro ao processar pedido",
      });
    } finally {
      setIsChecking(false);
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();

    setErrors((prev) => ({ ...prev, code: undefined, general: undefined }));
    setSuccessMessage(null);

    if (!code.trim()) {
      setErrors((prev) => ({
        ...prev,
        code: "Introduz o código recebido por email",
      }));
      return;
    }

    try {
      setIsVerifyingCode(true);

      const response = await fetch("/api/candidatos/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          telefone: normalizedPhone,
          vaga_id: vagaId,
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          code: data?.error || "Código inválido ou expirado",
        }));
        return;
      }

      // Guardar sessionToken em localStorage para reutilização dentro do TTL
      if (data.sessionToken) {
        localStorage.setItem(
          `interview_session_${vagaId}`,
          JSON.stringify({
            token: data.sessionToken,
            expiresAt: data.expiresAt,
          }),
        );
      }

      onSuccess(normalizedEmail, normalizedPhone);
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      setErrors((prev) => ({
        ...prev,
        code: "Erro ao verificar código",
      }));
    } finally {
      setIsVerifyingCode(false);
    }
  }

  async function handleResendCode() {
    setErrors((prev) => ({ ...prev, code: undefined, general: undefined }));
    setSuccessMessage(null);

    try {
      setIsSendingCode(true);

      const response = await fetch("/api/candidatos/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          telefone: normalizedPhone,
          vaga_id: vagaId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          general: data?.error || "Erro ao reenviar código",
        }));
        return;
      }

      setSuccessMessage("Código reenviado com sucesso.");
    } catch (error) {
      console.error("Erro ao reenviar código:", error);
      setErrors((prev) => ({
        ...prev,
        general: "Erro ao reenviar código",
      }));
    } finally {
      setIsSendingCode(false);
    }
  }

  if (step === "code") {
    return (
      <div className="w-full max-w-md mx-auto">
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-[var(--c-text)] mb-2"
            >
              Código de verificação *
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setErrors((prev) => ({ ...prev, code: undefined }));
              }}
              placeholder="Ex: 123456"
              className="w-full px-3 py-2 rounded-lg border border-[var(--c-border)]/80 bg-[var(--c-surface)] text-[var(--c-text)] placeholder-[var(--c-text)]/50 transition-colors duration-200 focus:outline-none focus:border-[var(--c-brand)]/60 focus:ring-1 focus:ring-[var(--c-brand)]/30"
              disabled={isLoading || isVerifyingCode}
            />

            {errors.code && (
              <p className="mt-1 text-xs text-red-500">{errors.code}</p>
            )}
          </div>

          <div className="rounded-lg border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-3 py-3">
            <p className="text-sm text-[var(--c-text)]/80">
              Enviámos um código para:
            </p>
            <p className="text-sm font-medium text-[var(--c-text)] mt-1">
              {normalizedEmail}
            </p>
          </div>

          {successMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {errors.general && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isVerifyingCode}
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--c-brand)] text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:shadow-lg"
          >
            {isVerifyingCode ? "A verificar..." : "Verificar código"}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={isSendingCode}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--c-border)] text-[var(--c-text)] font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingCode ? "A reenviar..." : "Reenviar código"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("form");
              setCode("");
              setErrors({});
              setSuccessMessage(null);
            }}
            className="w-full text-xs text-[var(--c-text)]/60 underline"
          >
            Voltar atrás
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSendCode} className="space-y-5">
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
              setErrors((prev) => ({
                ...prev,
                email: undefined,
                general: undefined,
              }));
            }}
            placeholder="teu@email.com"
            className="w-full px-3 py-2 rounded-lg border border-[var(--c-border)]/80 bg-[var(--c-surface)] text-[var(--c-text)] placeholder-[var(--c-text)]/50 transition-colors duration-200 focus:outline-none focus:border-[var(--c-brand)]/60 focus:ring-1 focus:ring-[var(--c-brand)]/30"
            required
            disabled={isLoading || isChecking || isSendingCode}
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
              setErrors((prev) => ({
                ...prev,
                phone: undefined,
                general: undefined,
              }));
            }}
            placeholder="91 234 5678"
            className="w-full px-3 py-2 rounded-lg border border-[var(--c-border)]/80 bg-[var(--c-surface)] text-[var(--c-text)] placeholder-[var(--c-text)]/50 transition-colors duration-200 focus:outline-none focus:border-[var(--c-brand)]/60 focus:ring-1 focus:ring-[var(--c-brand)]/30"
            required
            disabled={isLoading || isChecking || isSendingCode}
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

        {successMessage && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {errors.general && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={
            isLoading || isChecking || isSendingCode || !!duplicateWarning
          }
          className="w-full px-4 py-2.5 rounded-lg bg-[var(--c-brand)] text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:shadow-lg"
        >
          {isChecking || isSendingCode ? "A processar..." : "Enviar código"}
        </button>

        <p className="text-xs text-[var(--c-text)]/50 text-center">
          Vamos enviar um código por email para desbloquear a entrevista.
        </p>
      </form>
    </div>
  );
}
