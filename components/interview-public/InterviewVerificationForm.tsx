"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-number-input";
import type { CountryCode, E164Number } from "libphonenumber-js";
import {
  isValidPhoneNumber,
  parsePhoneNumber,
  getExampleNumber,
  getCountryCallingCode,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import { withBasePath } from "@/lib/base-path";
import { tInterview } from "@/lib/i18n/interview";
import {
  IconAlertCircle,
  IconArrowRight,
  IconMail,
  IconShield,
  IconUser,
} from "@/components/ui/Icons";

type Props = {
  locale: string;
  slug: string;
  interviewId: string;
  interviewTitle: string;
};

const DEFAULT_COUNTRY: CountryCode = "PT";

function getMaxNationalDigits(country: CountryCode): number {
  try {
    const example = getExampleNumber(country, examples);
    if (example) {
      return example.nationalNumber.length;
    }
  } catch {}
  return 15;
}

function getNationalDigits(value: string, country: CountryCode): string {
  const callingCode = String(getCountryCallingCode(country)).replace(/\D/g, "");
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.startsWith(callingCode)
    ? digitsOnly.slice(callingCode.length)
    : digitsOnly;
}

function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="40 20"
      />
    </svg>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-[var(--c-text)]/55 tracking-wide"
      >
        {label}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-red-500">
          <IconAlertCircle />
          <p className="text-[12px] font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}

export default function InterviewVerificationForm({
  locale,
  slug,
  interviewId,
  interviewTitle,
}: Props) {
  const router = useRouter();

  const [candidateName, setCandidateName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<E164Number | undefined>();
  const [phoneCountry, setPhoneCountry] =
    useState<CountryCode>(DEFAULT_COUNTRY);

  // Ref para aceder ao phoneCountry actual dentro dos event handlers sem stale closure
  const phoneCountryRef = useRef<CountryCode>(DEFAULT_COUNTRY);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parsedPhone = useMemo(() => {
    if (!phone) return undefined;
    try {
      return parsePhoneNumber(phone);
    } catch {
      return undefined;
    }
  }, [phone]);

  function validateName(value: string) {
    return value.trim()
      ? undefined
      : tInterview(locale, "verificationForm.nameRequired");
  }

  function validateEmail(value: string) {
    const v = value.trim();
    if (!v) return tInterview(locale, "verificationForm.emailRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return tInterview(locale, "verificationForm.emailInvalid");
    }
    return undefined;
  }

  function validatePhone(value?: string) {
    if (!value) return tInterview(locale, "verificationForm.phoneRequired");
    if (!isValidPhoneNumber(value)) {
      return tInterview(locale, "verificationForm.phoneInvalid");
    }
    return undefined;
  }

  function handleBlur(field: "name" | "email" | "phone") {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (field === "name") next.name = validateName(candidateName);
      if (field === "email") next.email = validateEmail(email);
      if (field === "phone") next.phone = validatePhone(phone);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGlobalError(null);
    setInfo(null);

    const normalizedName = candidateName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const errors = {
      name: validateName(normalizedName),
      email: validateEmail(normalizedEmail),
      phone: validatePhone(phone),
    };

    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    const normalizedPhone = parsedPhone?.number ?? phone;
    const detectedCountry = (parsedPhone?.country ||
      phoneCountry ||
      DEFAULT_COUNTRY) as CountryCode;

    setIsLoading(true);

    try {
      const response = await fetch(
        withBasePath("/api/public/interviews/verification/send"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            interviewId,
            candidateName: normalizedName,
            email: normalizedEmail,
            telefone: normalizedPhone,
            telefone_pais: detectedCountry,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setGlobalError(
          data?.error || tInterview(locale, "verificationForm.sendCodeError"),
        );
        return;
      }

      if (data?.devCode) {
        setInfo(
          tInterview(locale, "verificationForm.devCode", {
            code: data.devCode,
          }),
        );
      }

      router.push(
        `/${locale}/${slug}/interview/${interviewId}/verify` +
          `?email=${encodeURIComponent(normalizedEmail)}` +
          `&telefone=${encodeURIComponent(normalizedPhone || "")}` +
          `&telefone_pais=${encodeURIComponent(detectedCountry)}` +
          `&candidateName=${encodeURIComponent(normalizedName)}`,
      );
    } catch (error) {
      console.error(error);
      setGlobalError(tInterview(locale, "verificationForm.serverConnectionError"));
    } finally {
      setIsLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border bg-white text-[var(--c-text)] text-sm placeholder:text-[var(--c-text)]/25 transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const inputIdle =
    "border-[var(--c-border)] focus:border-[var(--c-brand)] focus:ring-2 focus:ring-[var(--c-brand)]/15";
  const inputErr =
    "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-300/20";

  const phoneInputClass = fieldErrors.phone
    ? `${inputBase} ${inputErr}`
    : `${inputBase} ${inputIdle}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--c-bg)] px-4 py-16">
      <div className="w-full max-w-[460px]">
        <div className="overflow-hidden rounded-3xl border border-[var(--c-border)] bg-white shadow-[0_10px_40px_-12px_rgba(0,0,0,0.12)]">
          <div className="h-1 bg-[var(--c-brand)]" />

          <div className="border-b border-[var(--c-border)]/70 px-8 pb-6 pt-7">
            <h1 className="text-[18px] font-semibold leading-snug text-[var(--c-text)]">
              {interviewTitle}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--c-text)]/55">
              {tInterview(locale, "verificationForm.intro")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5 px-8 py-7"
          >
            <Field
              id="name"
              label={tInterview(locale, "verificationForm.nameLabel")}
              error={fieldErrors.name}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--c-text)]/30">
                  <IconUser />
                </span>
                <input
                  id="name"
                  type="text"
                  value={candidateName}
                  onChange={(e) => {
                    setCandidateName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  onBlur={() => handleBlur("name")}
                  className={`${inputBase} ${fieldErrors.name ? inputErr : inputIdle} pl-10 pr-4 py-3`}
                  placeholder={tInterview(locale, "verificationForm.namePlaceholder")}
                  autoComplete="name"
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.name}
                  required
                />
              </div>
            </Field>

            <Field
              id="email"
              label={tInterview(locale, "verificationForm.emailLabel")}
              error={fieldErrors.email}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--c-text)]/30">
                  <IconMail />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  onBlur={() => handleBlur("email")}
                  className={`${inputBase} ${fieldErrors.email ? inputErr : inputIdle} pl-10 pr-4 py-3`}
                  placeholder={tInterview(locale, "verificationForm.emailPlaceholder")}
                  autoComplete="email"
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.email}
                  required
                />
              </div>
            </Field>

            <Field
              id="phone"
              label={tInterview(locale, "verificationForm.phoneLabel")}
              error={fieldErrors.phone}
            >
              <div
                className={`rounded-xl [&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:gap-2
                  [&_.PhoneInputCountry]:shrink-0 [&_.PhoneInputCountry]:pl-3.5
                  [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:outline-none
                  [&_.PhoneInputCountryIcon]:h-5 [&_.PhoneInputCountryIcon]:w-7
                  [&_.PhoneInputInput]:min-w-0 [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:py-3 [&_.PhoneInputInput]:pr-4 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:outline-none`}
              >
                <PhoneInput
                  id="phone"
                  international
                  defaultCountry={DEFAULT_COUNTRY}
                  country={phoneCountry}
                  onCountryChange={(value) => {
                    if (value) {
                      phoneCountryRef.current = value;
                      setPhoneCountry(value);
                      setPhone(undefined);
                      setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                    }
                  }}
                  countryCallingCodeEditable={false}
                  value={phone}
                  onChange={(value) => {
                    if (value) {
                      const country = phoneCountryRef.current;
                      const nationalDigits = getNationalDigits(value, country);
                      const maxDigits = getMaxNationalDigits(country);
                      if (nationalDigits.length > maxDigits) return;
                    }
                    setPhone(value);
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  onBlur={() => handleBlur("phone")}
                  disabled={isLoading}
                  placeholder={tInterview(locale, "verificationForm.phonePlaceholder")}
                  className={phoneInputClass}
                  numberInputProps={{
                    autoComplete: "tel",
                    "aria-invalid": !!fieldErrors.phone,
                    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                      const isDigit = /^\d$/.test(e.key);
                      if (!isDigit) return;

                      const input = e.currentTarget;
                      const currentValue = input.value.replace(/\D/g, "");
                      const country = phoneCountryRef.current;
                      const callingCode = String(
                        getCountryCallingCode(country),
                      ).replace(/\D/g, "");
                      const nationalDigits = currentValue.startsWith(
                        callingCode,
                      )
                        ? currentValue.slice(callingCode.length)
                        : currentValue;

                      if (
                        nationalDigits.length >= getMaxNationalDigits(country)
                      ) {
                        e.preventDefault();
                      }
                    },
                  }}
                />
              </div>
            </Field>

            {globalError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="mt-px shrink-0 text-red-400">
                  <IconAlertCircle />
                </span>
                <p className="text-[13px] leading-snug text-red-700">
                  {globalError}
                </p>
              </div>
            )}

            {info && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[13px] text-amber-800">{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--c-brand)] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size={15} />
                  <span>{tInterview(locale, "verificationForm.sending")}</span>
                </>
              ) : (
                <>
                  <span>{tInterview(locale, "verificationForm.continue")}</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <IconArrowRight />
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 pt-1 text-[var(--c-text)]/35">
              <IconShield />
              <p className="text-[11px] tracking-wide">
                {tInterview(locale, "verificationForm.secure")}
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
