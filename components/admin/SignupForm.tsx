"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";
import { tAuth } from "@/lib/i18n/auth";
import { normalizeLocale } from "@/lib/i18n/locales";

type SignupFormProps = {
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

export default function SignupForm({ locale = "en", nextPath = "" }: SignupFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const response = await fetch(withBasePath("/api/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          next: nextPath,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErro(data.error || tAuth(locale, "signupForm.defaultError"));
        return;
      }

      router.push(data.redirectTo || withLocale("/plans", locale));
      router.refresh();
    } catch (error) {
      setErro(tAuth(locale, "signupForm.networkError"));
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignup} className="card p-6 space-y-4">
      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {erro}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="name">
          {tAuth(locale, "signupForm.nameLabel")}
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder={tAuth(locale, "signupForm.namePlaceholder")}
          className="input-base"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="email">
          {tAuth(locale, "signupForm.emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder={tAuth(locale, "signupForm.emailPlaceholder")}
          className="input-base"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="password">
          {tAuth(locale, "signupForm.passwordLabel")}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder={tAuth(locale, "signupForm.passwordPlaceholder")}
          className="input-base"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading
          ? tAuth(locale, "signupForm.loading")
          : tAuth(locale, "signupForm.submit")}
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
        {tAuth(locale, "signupForm.googleAction")}
      </a>

      <p className="text-xs text-gray-500 text-center">
        {tAuth(locale, "signupForm.hasAccount")}{" "}
        <Link
          href={withLocale("/admin/login", locale)}
          className="text-[var(--c-brand)] font-medium"
        >
          {tAuth(locale, "signupForm.login")}
        </Link>
      </p>
    </form>
  );
}
