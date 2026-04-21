"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";

export default function SignupForm() {
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
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErro(data.error || "Não foi possível criar a conta");
        return;
      }

      router.push(data.redirectTo || "/onboarding");
      router.refresh();
    } catch (error) {
      setErro("Erro ao criar conta. Tenta novamente.");
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
          Nome
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Nome da conta"
          className="input-base"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="tu@empresa.com"
          className="input-base"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          className="input-base"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? "A criar conta..." : "Criar conta"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Já tens conta?{" "}
        <Link href="/admin/login" className="text-[var(--c-brand)] font-medium">
          Entrar
        </Link>
      </p>
    </form>
  );
}
