"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

type Props = {
  slug: string;
  initialName: string;
  initialDescription: string;
  initialLogoUrl: string;
};

export default function AdminCompanySettingsForm({
  slug,
  initialName,
  initialDescription,
  initialLogoUrl,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(withBasePath(`/api/companies/${slug}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          logoUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Não foi possível guardar alterações");
        return;
      }

      setSuccess("Definições atualizadas com sucesso.");
      router.refresh();
    } catch (requestError) {
      console.error("Erro ao guardar definições:", requestError);
      setError("Erro ao guardar alterações. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div>
        <label htmlFor="company-name" className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]">
          Nome da empresa
        </label>
        <input
          id="company-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="input-base"
        />
      </div>

      <div>
        <label htmlFor="company-description" className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]">
          Descrição
        </label>
        <textarea
          id="company-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input-base min-h-24"
          placeholder="Descrição curta da empresa"
        />
      </div>

      <div>
        <label htmlFor="company-logo-url" className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]">
          URL do logo
        </label>
        <input
          id="company-logo-url"
          type="url"
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
          className="input-base"
          placeholder="https://..."
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary inline-flex px-5 py-2.5">
        {loading ? "A guardar..." : "Guardar alterações"}
      </button>
    </form>
  );
}
