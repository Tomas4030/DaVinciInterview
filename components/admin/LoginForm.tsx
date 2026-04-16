"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_PATH } from "@/lib/base-path";


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
      const response = await fetch(`${BASE_PATH}/api/auth/login-admin`, {
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

      // Guardar token no localStorage
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_email", data.admin.email);

      router.push(`${BASE_PATH}/admin`);
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
          placeholder="admin@davincinterviews.com"
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
    </form>
  );
}
