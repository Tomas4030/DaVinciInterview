"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { tInterview } from "@/lib/i18n/interview";
import {
  IconAlertCircle,
  IconArrowRight,
  IconMail,
  IconShield,
} from "@/components/ui/Icons";

type Props = {
  locale: string;
  slug: string;
  interviewId: string;
  email: string;
  telefone?: string;
  candidateName?: string;
};

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
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="40 20"
      />
    </svg>
  );
}

export default function InterviewVerifyCodeForm({
  locale,
  slug,
  interviewId,
  email,
  telefone,
  candidateName,
}: Props) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  const cooldownStorageKey = useMemo(
    () => `verify_code_resend_cooldown_${interviewId}_${email.toLowerCase()}`,
    [email, interviewId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const storedExpires = Number(localStorage.getItem(cooldownStorageKey) || 0);

    if (storedExpires > now) {
      setResendTimer(Math.max(0, Math.ceil((storedExpires - now) / 1000)));
    } else {
      const initialExpires = now + 30_000;
      localStorage.setItem(cooldownStorageKey, String(initialExpires));
      setResendTimer(30);
    }

    const interval = window.setInterval(() => {
      const expires = Number(localStorage.getItem(cooldownStorageKey) || 0);
      const diff = expires - Date.now();

      if (diff <= 0) {
        setResendTimer(0);
        return;
      }

      setResendTimer(Math.ceil(diff / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownStorageKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!code.trim()) {
      setError(tInterview(locale, "verifyCodeForm.enterCodeError"));
      return;
    }

    try {
      setIsLoading(true);

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
        setError(data?.error || tInterview(locale, "verifyCodeForm.invalidCodeError"));
        return;
      }

      if (typeof window !== "undefined") {
        const chatPrefix = `public_interview_chat_${interviewId}`;
        for (let index = localStorage.length - 1; index >= 0; index -= 1) {
          const key = localStorage.key(index);
          if (key && key.startsWith(chatPrefix)) {
            localStorage.removeItem(key);
          }
        }

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

      router.push(`/${locale}/${slug}/interview/${interviewId}/chat`);
    } catch (requestError) {
      console.error(requestError);
      setError(tInterview(locale, "verifyCodeForm.serverConnectionError"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendTimer > 0 || isResending) return;

    setError(null);
    setSuccessMessage(null);

    try {
      setIsResending(true);

      const response = await fetch(
        withBasePath("/api/public/interviews/verification/send"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug,
            interviewId,
            email,
            telefone,
            candidateName,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || tInterview(locale, "verifyCodeForm.resendError"));
        return;
      }

      const nextExpiresAt = Date.now() + 30_000;
      localStorage.setItem(cooldownStorageKey, String(nextExpiresAt));
      setResendTimer(30);
      setSuccessMessage(tInterview(locale, "verifyCodeForm.resendSuccess"));
    } catch (requestError) {
      console.error(requestError);
      setError(tInterview(locale, "verifyCodeForm.resendConnectionError"));
    } finally {
      setIsResending(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border bg-white text-[var(--c-text)] text-sm placeholder:text-[var(--c-text)]/25 transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const inputIdle =
    "border-[var(--c-border)] focus:border-[var(--c-brand)] focus:ring-2 focus:ring-[var(--c-brand)]/15";
  const inputErr =
    "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-300/20";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--c-bg)] px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="overflow-hidden rounded-3xl border border-[var(--c-border)] bg-white shadow-[0_10px_30px_-14px_rgba(0,0,0,0.12)]">
          <div className="h-1 bg-[var(--c-brand)]" />

          <div className="border-b border-[var(--c-border)]/70 px-6 pb-5 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--c-brand)]/10 text-[var(--c-brand)]">
                <IconMail />
              </div>

              <div>
                <h1 className="text-[16px] font-semibold leading-snug text-[var(--c-text)]">
                  {tInterview(locale, "verifyCodeForm.title")}
                </h1>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--c-text)]/55">
                  {tInterview(locale, "verifyCodeForm.description")}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <label
                htmlFor="code"
                className="block text-[12px] font-medium tracking-wide text-[var(--c-text)]/55"
              >
                {tInterview(locale, "verifyCodeForm.codeLabel")}
              </label>

              <input
                id="code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                inputMode="numeric"
                placeholder="123456"
                autoFocus
                required
                disabled={isLoading}
                className={`${inputBase} ${error ? inputErr : inputIdle} px-4 py-2.5 text-center font-mono text-[1.35rem] tracking-[0.28em]`}
              />

              {error && (
                <div className="flex items-center gap-1.5 text-red-500">
                  <IconAlertCircle />
                  <p className="text-[11px] font-medium">{error}</p>
                </div>
              )}
            </div>

            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <p className="text-[12px] text-emerald-700">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--c-brand)] px-5 py-3 text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size={15} />
                  <span>{tInterview(locale, "verifyCodeForm.validating")}</span>
                </>
              ) : (
                <>
                  <span>{tInterview(locale, "verifyCodeForm.continue")}</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <IconArrowRight />
                  </span>
                </>
              )}
            </button>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-[var(--c-border)] bg-white px-4 py-2.5 text-[13px] font-medium text-[var(--c-text)]/70 transition-all duration-150 hover:bg-[var(--c-bg)] active:scale-[0.985]"
              >
                {tInterview(locale, "verifyCodeForm.back")}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending || resendTimer > 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-[var(--c-border)] bg-white px-4 py-2.5 text-[13px] font-medium text-[var(--c-text)]/70 transition-all duration-150 hover:bg-[var(--c-bg)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <LoadingSpinner size={14} />
                    <span>{tInterview(locale, "verifyCodeForm.resending")}</span>
                  </>
                ) : resendTimer > 0 ? (
                  tInterview(locale, "verifyCodeForm.resendIn", {
                    seconds: resendTimer,
                  })
                ) : (
                  tInterview(locale, "verifyCodeForm.resendCode")
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-0.5 text-[var(--c-text)]/35">
              <IconShield />
              <p className="text-[10px] tracking-wide">
                {tInterview(locale, "verifyCodeForm.secure")}
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
