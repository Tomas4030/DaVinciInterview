"use client";

import { useState } from "react";
import {
  isValidEmail,
  isValidPhoneNumber,
  formatPhoneNumber,
} from "@/lib/validation";
import { IconMail, IconPhone, IconShield } from "@/components/home/Icons";

interface CandidateInfoFormProps {
  vagaId: string;
  onSuccess: (email: string, phone: string) => void;
  isLoading?: boolean;
}

function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="0"
      />
    </svg>
  );
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

  const inputDisabled = isLoading || isChecking || isSendingCode;

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();

    setErrors({});
    setDuplicateWarning(null);
    setSuccessMessage(null);

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
        <div className="bg-white rounded-2xl border border-[var(--c-border)] p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--c-brand-soft)] flex items-center justify-center mx-auto mb-4">
              <IconMail />
            </div>
            <h2 className="text-xl font-semibold text-[var(--c-text)]">
              Verificação por email
            </h2>
            <p className="text-sm text-[var(--c-text)]/60 mt-2">
              Enviámos um código para
            </p>
            <p className="text-base font-medium text-[var(--c-text)] mt-0.5">
              {normalizedEmail}
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <label htmlFor="code" className="sr-only">
                Código de verificação
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(val);
                  setErrors((prev) => ({ ...prev, code: undefined }));
                }}
                placeholder="123456"
                className="w-full px-6 py-4 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] text-center text-2xl tracking-[0.35em] font-mono placeholder:text-[var(--c-text)]/25 transition-all duration-200 focus:outline-none focus:border-[var(--c-brand)] focus:ring-2 focus:ring-[var(--c-brand)]/20 disabled:opacity-50"
                disabled={isLoading || isVerifyingCode}
                autoFocus
              />
              {errors.code && (
                <p className="mt-2 text-sm text-red-500 text-center">
                  {errors.code}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || isVerifyingCode || code.length < 6}
              className="w-full px-6 py-4 rounded-xl bg-[var(--c-brand)] text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:bg-[var(--c-brand-dark)] active:scale-[0.98] flex items-center justify-center gap-2.5 text-base"
            >
              {isVerifyingCode ? (
                <>
                  <LoadingSpinner size={18} />
                  A verificar...
                </>
              ) : (
                "Verificar código"
              )}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isSendingCode}
                className="flex-1 px-5 py-3 rounded-xl border border-[var(--c-border)] text-[var(--c-text)]/70 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--c-bg)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSendingCode ? (
                  <>
                    <LoadingSpinner size={14} />
                    A reenviar
                  </>
                ) : (
                  "Reenviar código"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setCode("");
                  setErrors({});
                  setSuccessMessage(null);
                }}
                className="flex-1 px-5 py-3 rounded-xl border border-[var(--c-border)] text-[var(--c-text)]/70 font-medium transition-all duration-200 hover:bg-[var(--c-bg)] active:scale-[0.98]"
              >
                Alterar dados
              </button>
            </div>
          </form>

          {errors.general && (
            <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600 text-center">
                {errors.general}
              </p>
            </div>
          )}

          {successMessage && (
            <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="text-sm text-green-600 text-center">
                {successMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-[var(--c-border)] p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-[var(--c-text)]">
            Validar contacto
          </h2>
          <p className="text-sm text-[var(--c-text)]/60 mt-2">
            Preenche os teus dados para continuares
          </p>
        </div>

        <form onSubmit={handleSendCode} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--c-text)]/70 pl-1"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--c-text)]/40">
                <IconMail />
              </div>
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
                  setDuplicateWarning(null);
                }}
                placeholder="teu@email.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] placeholder:text-[var(--c-text)]/30 transition-all duration-200 focus:outline-none focus:border-[var(--c-brand)] focus:ring-2 focus:ring-[var(--c-brand)]/20 disabled:opacity-50 text-base"
                required
                disabled={inputDisabled}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500 pl-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-[var(--c-text)]/70 pl-1"
            >
              Telemóvel
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--c-text)]/40">
                <IconPhone />
              </div>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d\s]/g, "");
                  setPhone(val);
                  setErrors((prev) => ({
                    ...prev,
                    phone: undefined,
                    general: undefined,
                  }));
                  setDuplicateWarning(null);
                }}
                placeholder="91 234 5678"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] placeholder:text-[var(--c-text)]/30 transition-all duration-200 focus:outline-none focus:border-[var(--c-brand)] focus:ring-2 focus:ring-[var(--c-brand)]/20 disabled:opacity-50 text-base"
                required
                disabled={inputDisabled}
                autoComplete="tel"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-500 pl-1">{errors.phone}</p>
            )}
          </div>

          {duplicateWarning && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-sm text-amber-800 font-medium">
                {duplicateWarning}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Podes candidatar-te a outras vagas ou aguarda feedback.
              </p>
            </div>
          )}

          {errors.general && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={inputDisabled || !!duplicateWarning}
            className="w-full px-6 py-4 rounded-xl bg-[var(--c-brand)] text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:bg-[var(--c-brand-dark)] active:scale-[0.98] flex items-center justify-center gap-2.5 text-base"
          >
            {isChecking ? (
              <>
                <LoadingSpinner size={18} />
                A verificar...
              </>
            ) : isSendingCode ? (
              <>
                <LoadingSpinner size={18} />
                A enviar código...
              </>
            ) : (
              "Continuar"
            )}
          </button>

          <div className="flex items-start gap-3 text-[var(--c-text)]/50 pt-2">
            <div className="mt-0.5">
              <IconShield />
            </div>
            <p className="text-sm leading-relaxed">
              Os teus dados estão protegidos e nunca serão partilhados com
              terceiros.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}