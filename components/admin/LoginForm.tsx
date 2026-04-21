"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const response = await fetch(withBasePath("/api/auth/login-admin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErro(data.error || "Email ou password incorretos");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem("admin_token", data.token);
      }
      if (data?.admin?.email) {
        localStorage.setItem("admin_email", data.admin.email);
      }

      router.push(data.redirectTo || "/onboarding");
      router.refresh();
    } catch (err) {
      setErro("Erro ao fazer login. Tenta novamente.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="card p-6 space-y-4">
      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {erro}
        </div>
      )}

      <div>
        <label
          className="block text-xs font-medium text-gray-600 mb-1.5"
          htmlFor="email"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="admin@MatchWorkynterviews.com"
          className="input-base"
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-gray-600 mb-1.5"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="input-base"
        />
      </div>

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
            A entrar…
          </span>
        ) : (
          "Entrar"
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Ainda não tens conta?{" "}
        <Link href="/signup" className="text-[var(--c-brand)] font-medium">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
