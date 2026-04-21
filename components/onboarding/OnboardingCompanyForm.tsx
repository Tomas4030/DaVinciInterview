"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

function slugify(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export default function OnboardingCompanyForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4355e8");
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const effectiveSlug = useMemo(() => {
    if (isSlugTouched) {
      return slugify(slug);
    }
    return slugify(name);
  }, [isSlugTouched, name, slug]);

  async function checkSlugAvailability(nextSlug: string): Promise<boolean> {
    if (!nextSlug || nextSlug.length < 2) {
      setIsSlugAvailable(false);
      setSlugError("Slug inválido");
      return false;
    }

    setIsSlugChecking(true);
    setSlugError("");

    try {
      const response = await fetch(
        withBasePath(
          `/api/companies/check-slug?slug=${encodeURIComponent(nextSlug)}`,
        ),
      );
      const data = await response.json();
      if (!response.ok) {
        setIsSlugAvailable(false);
        setSlugError(data.error || "Não foi possível validar o slug");
        return false;
      }

      const available = Boolean(data.available);
      setIsSlugAvailable(available);
      if (!available) {
        setSlugError("Este slug já está em uso");
      }
      return available;
    } catch (error) {
      setIsSlugAvailable(false);
      setSlugError("Erro ao validar slug");
      console.error("Erro ao validar slug:", error);
      return false;
    } finally {
      setIsSlugChecking(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError("");

    const slugValid = await checkSlugAvailability(effectiveSlug);
    if (!effectiveSlug || !slugValid) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(withBasePath("/api/onboarding/company"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug: effectiveSlug,
          description,
          logoUrl,
          primaryColor,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setSubmitError(data.error || "Não foi possível criar a empresa");
        if (data.redirectTo) {
          router.push(data.redirectTo);
          router.refresh();
        }
        return;
      }

      router.push(data.redirectTo || "/admin");
      router.refresh();
    } catch (error) {
      setSubmitError("Erro ao criar empresa. Tenta novamente.");
      console.error("Erro no onboarding:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      {submitError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {submitError}
        </div>
      )}

      <div>
        <label
          className="block text-xs font-medium text-gray-600 mb-1.5"
          htmlFor="company-name"
        >
          Nome da empresa
        </label>
        <input
          id="company-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          placeholder="Ex: MatchWorky Tech"
          className="input-base"
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-gray-600 mb-1.5"
          htmlFor="company-slug"
        >
          Slug da empresa
        </label>
        <div className="flex gap-2">
          <input
            id="company-slug"
            type="text"
            value={isSlugTouched ? slug : effectiveSlug}
            onChange={(event) => {
              setIsSlugTouched(true);
              setSlug(event.target.value);
              setIsSlugAvailable(null);
              setSlugError("");
            }}
            onBlur={() => checkSlugAvailability(effectiveSlug)}
            required
            className="input-base"
          />
          <button
            type="button"
            onClick={() => checkSlugAvailability(effectiveSlug)}
            disabled={isSlugChecking}
            className="btn-primary px-4"
          >
            {isSlugChecking ? "A validar..." : "Validar"}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          URL pública: /{effectiveSlug || "empresa"}
        </p>
        {slugError && <p className="mt-1 text-xs text-red-600">{slugError}</p>}
        {!slugError && isSlugAvailable && (
          <p className="mt-1 text-xs text-emerald-600">Slug disponível</p>
        )}
      </div>

      <div>
        <label
          className="block text-xs font-medium text-gray-600 mb-1.5"
          htmlFor="company-description"
        >
          Descrição
        </label>
        <textarea
          id="company-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descrição curta da tua empresa"
          className="input-base min-h-24"
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-gray-600 mb-1.5"
          htmlFor="company-logo-url"
        >
          URL do logo
        </label>
        <input
          id="company-logo-url"
          type="url"
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
          placeholder="https://..."
          className="input-base"
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-gray-600 mb-1.5"
          htmlFor="company-primary-color"
        >
          Cor primária
        </label>
        <input
          id="company-primary-color"
          type="color"
          value={primaryColor}
          onChange={(event) => setPrimaryColor(event.target.value)}
          className="h-10 w-full rounded-xl border border-[var(--c-border)] bg-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3"
      >
        {loading ? "A criar empresa..." : "Criar empresa"}
      </button>
    </form>
  );
}
