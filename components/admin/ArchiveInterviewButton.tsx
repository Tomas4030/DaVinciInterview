"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { withBasePath } from "@/lib/base-path";
import { tAdmin } from "@/lib/i18n/admin";

type Props = {
  slug: string;
  interviewId: string;
  currentStatus?: string;
  locale?: string;
};

function ArchiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" stroke="currentColor" strokeWidth="2" />
      <path d="M10 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ArchiveInterviewButton({
  slug,
  interviewId,
  currentStatus = "draft",
  locale = "en",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isArchived = currentStatus === "archived";

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

  async function handleArchive() {
    setLoading(true);
    try {
      const response = await fetch(withBasePath(`/api/companies/${slug}/interviews/${interviewId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isArchived ? "draft" : "archived" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(
          data?.error ||
            tAdmin(
              locale,
              isArchived
                ? "interviews.listCard.unarchiveError"
                : "interviews.listCard.archiveError",
            ),
        );
        return;
      }
      setShowConfirmModal(false);
      router.refresh();
    } catch {
      window.alert(
        tAdmin(
          locale,
          isArchived
            ? "interviews.listCard.unarchiveError"
            : "interviews.listCard.archiveError",
        ),
      );
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
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
      >
        <ArchiveIcon />
        {loading
          ? tAdmin(
              locale,
              isArchived
                ? "interviews.listCard.unarchiving"
                : "interviews.listCard.archiving",
            )
          : tAdmin(
              locale,
              isArchived
                ? "interviews.listCard.unarchive"
                : "interviews.listCard.archive",
            )}
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
              {tAdmin(
                locale,
                isArchived
                  ? "archiveInterview.unarchiveConfirmTitle"
                  : "archiveInterview.confirmTitle",
              )}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[var(--c-muted)]">
              {isArchived
                ? tAdmin(locale, "archiveInterview.unarchiveConfirmBody")
                : tAdmin(locale, "archiveInterview.confirmBody")}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm font-medium text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg)] disabled:opacity-50"
              >
                {tAdmin(locale, "archiveInterview.cancel")}
              </button>

              <button
                type="button"
                onClick={handleArchive}
                disabled={loading}
                className="rounded-lg border border-amber-200 bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                {loading
                  ? tAdmin(
                      locale,
                      isArchived
                        ? "interviews.listCard.unarchiving"
                        : "interviews.listCard.archiving",
                    )
                  : tAdmin(
                      locale,
                      isArchived
                        ? "archiveInterview.unarchiveConfirm"
                        : "archiveInterview.confirm",
                    )}
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
