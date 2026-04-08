"use client";

function MailIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 opacity-60"
    >
      <path d="M4 6h16v12H4z" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 opacity-60"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.23a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

interface ContactPillsProps {
  email?: string | null;
  telefone?: string | null;
}

export function ContactPills({ email, telefone }: ContactPillsProps) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {email && (
        <a
          href={`mailto:${email}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex max-w-[200px] items-center gap-1.5 truncate rounded-full border border-[var(--c-border)]/60 bg-[var(--c-bg)] px-2.5 py-1 text-xs text-[var(--c-muted)] transition hover:text-[var(--c-text)]"
        >
          <MailIcon />
          {email}
        </a>
      )}
      {telefone && (
        <a
          href={`tel:${telefone}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-border)]/60 bg-[var(--c-bg)] px-2.5 py-1 text-xs text-[var(--c-muted)] transition hover:text-[var(--c-text)]"
        >
          <PhoneIcon />
          {telefone}
        </a>
      )}
      {!email && !telefone && (
        <span className="text-xs text-[var(--c-muted)]/50">
          Sem contacto identificado
        </span>
      )}
    </div>
  );
}
