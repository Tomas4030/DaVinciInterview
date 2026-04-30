"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { withBasePath } from "@/lib/base-path";
import { tAdmin } from "@/lib/i18n/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  slug: string;
  interviewId: string;
  locale?: string;
};

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 6l-1 14a1 1 0 0 1-1 .93H7a1 1 0 0 1-1-.93L5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DeleteInterviewButton({
  slug,
  interviewId,
  locale = "en",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showConfirmModal) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        setShowConfirmModal(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirmModal, loading]);

  async function handleConfirmDelete() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        withBasePath(`/api/companies/${slug}/interviews/${interviewId}`),
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || tAdmin(locale, "deleteInterview.defaultError"));
        return;
      }

      setShowConfirmModal(false);
      router.refresh();
    } catch {
      setError(tAdmin(locale, "deleteInterview.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.05em] text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
      >
        <TrashIcon />
        {loading
          ? tAdmin(locale, "deleteInterview.loading")
          : tAdmin(locale, "deleteInterview.trigger")}
      </button>

      {showConfirmModal && mounted
        ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4"
          onClick={() => {
            if (!loading) setShowConfirmModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-[var(--c-border)] bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[var(--c-text)]">
              {tAdmin(locale, "deleteInterview.confirmTitle")}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[var(--c-muted)]">
              {tAdmin(locale, "deleteInterview.confirmBody")}
            </p>

            {error ? (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm font-medium text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg)] disabled:opacity-50"
              >
                {tAdmin(locale, "deleteInterview.cancel")}
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="rounded-lg border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loading
                  ? tAdmin(locale, "deleteInterview.loading")
                  : tAdmin(locale, "deleteInterview.confirm")}
              </button>
            </div>
          </div>
        </div>
        ,
        document.body,
      ) : null}
    </>
  );
}
