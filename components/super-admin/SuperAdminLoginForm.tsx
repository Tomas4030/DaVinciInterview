"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

export default function SuperAdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(withBasePath("/api/super-admin/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(String(data?.error || "Email ou password inválidos"));
        return;
      }

      router.push(data.redirectTo || "/super-admin");
      router.refresh();
    } catch (submitError) {
      setError("Não foi possível autenticar agora. Tenta novamente.");
      console.error("super-admin login error", submitError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600" htmlFor="sa-email">
          Email
        </label>
        <input
          id="sa-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-base"
          placeholder="admin@company.com"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600" htmlFor="sa-password">
          Password
        </label>
        <input
          id="sa-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-base"
          placeholder="********"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? "A autenticar..." : "Entrar no Super Admin"}
      </button>
    </form>
  );
}
