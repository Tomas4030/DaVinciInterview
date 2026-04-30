"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { tAuth } from "@/lib/i18n/auth";
import { normalizeLocale } from "@/lib/i18n/locales";
import AlertPopup from "@/components/ui/alert-popup";

type LoginFormProps = {
  locale?: string;
  nextPath?: string;
};

function withLocale(path: string, locale: string): string {
  const safeLocale = normalizeLocale(locale);
  if (path === "/") {
    return `/${safeLocale}`;
  }
  return `/${safeLocale}${path}`;
}

export default function LoginForm({ locale = "en", nextPath = "" }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [info, setInfo] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const endpoint = challengeId
        ? "/api/auth/email-verification/complete"
        : "/api/auth/email-verification/send";

      const response = await fetch(withBasePath(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          challengeId
            ? {
              challengeId,
              code: verificationCode.trim(),
            }
            : {
              action: "login",
              email,
              password,
              next: nextPath,
            },
        ),
      });

      if (!response.ok) {
        const data = await response.json();
        setErro(data.error || tAuth(locale, "loginForm.defaultError"));
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (!challengeId) {
        setChallengeId(String(data.challengeId || ""));
        setInfo(tAuth(locale, "loginForm.codeSent"));
        if (data?.devCode) {
          setInfo(tAuth(locale, "loginForm.devCode", { code: data.devCode }));
        }
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("admin_token", data.token);
      }
      if (data?.admin?.email) {
        localStorage.setItem("admin_email", data.admin.email);
      }

      router.push(data.redirectTo || withLocale("/onboarding", locale));
      router.refresh();
    } catch (err) {
      setErro(tAuth(locale, "loginForm.networkError"));
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="card p-6 space-y-4">
      {erro ? (
        <AlertPopup message={erro} variant="destructive" onClose={() => setErro("")} />
      ) : null}

      <div>
        <label
          className="block text-xs font-medium text-gray-600 mb-1.5"
          htmlFor="email"
        >
          {tAuth(locale, "loginForm.emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder={tAuth(locale, "loginForm.emailPlaceholder")}
          className="input-base"
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-gray-600 mb-1.5"
          htmlFor="password"
        >
          {tAuth(locale, "loginForm.passwordLabel")}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder={tAuth(locale, "loginForm.passwordPlaceholder")}
          className="input-base"
        />


      </div>

      {challengeId && (
        <div>
          <label
            className="block text-xs font-medium text-gray-600 mb-1.5"
            htmlFor="verificationCode"
          >
            {tAuth(locale, "loginForm.codeLabel")}
          </label>
          <input
            id="verificationCode"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            placeholder={tAuth(locale, "loginForm.codePlaceholder")}
            className="input-base"
          />
        </div>
      )}

      {info ? (
        <AlertPopup message={info} variant="default" onClose={() => setInfo("")} />
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            {tAuth(locale, "loginForm.loading")}
          </span>
        ) : (
          challengeId
            ? tAuth(locale, "loginForm.verifySubmit")
            : tAuth(locale, "loginForm.submit")
        )}
      </button>

      <a
        href={withBasePath(
          `/api/auth/google/start?${new URLSearchParams({
            locale,
            next: nextPath,
          }).toString()}`,
        )}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--c-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--c-text)] transition hover:bg-gray-50"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.8 3.1-4.5 3.1-7.3z"
            fill="#4285F4"
          />
          <path
            d="M12 22c2.7 0 4.9-.9 6.5-2.4l-3.2-2.5c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4H3.3v2.6C4.9 19.8 8.2 22 12 22z"
            fill="#34A853"
          />
          <path
            d="M6.6 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.3C2.4 9.1 2 10.5 2 12s.4 2.9 1.3 4.6L6.6 14z"
            fill="#FBBC05"
          />
          <path
            d="M12 6.8c1.4 0 2.6.5 3.5 1.3l2.6-2.6C16.9 4.3 14.7 3.4 12 3.4c-3.8 0-7.1 2.2-8.7 5.4L6.6 11c.8-2.3 2.9-4.2 5.4-4.2z"
            fill="#EA4335"
          />
        </svg>
        {tAuth(locale, "loginForm.googleAction")}
      </a>

      <p className="text-xs text-gray-500 text-center">
        {tAuth(locale, "loginForm.noAccount")}{" "}
        <Link
          href={withLocale("/signup", locale)}
          className="text-[var(--c-brand)] font-medium"
        >
          {tAuth(locale, "loginForm.createAccount")}
        </Link>
      </p>
    </form>
  );
}
