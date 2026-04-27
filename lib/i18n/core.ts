import i18next from "i18next";
import enLanding from "@/locales/en/landing.json";
import ptLanding from "@/locales/pt/landing.json";
import enStaticPages from "@/locales/en/static-pages.json";
import ptStaticPages from "@/locales/pt/static-pages.json";
import enAuth from "@/locales/en/auth.json";
import ptAuth from "@/locales/pt/auth.json";
import enAdmin from "@/locales/en/admin.json";
import ptAdmin from "@/locales/pt/admin.json";
import enInterview from "@/locales/en/interview.json";
import ptInterview from "@/locales/pt/interview.json";

type I18nNamespace =
  | "landing"
  | "staticPages"
  | "auth"
  | "admin"
  | "interview";

const SUPPORTED_LOCALES = new Set(["pt", "en"]);

const i18n = i18next.createInstance();
let initialized = false;

function normalizeLocale(locale: string): "pt" | "en" {
  return SUPPORTED_LOCALES.has(locale) ? (locale as "pt" | "en") : "en";
}

function ensureI18nInitialized() {
  if (initialized) {
    return;
  }

  i18n.init({
    resources: {
      pt: {
        landing: ptLanding,
        staticPages: ptStaticPages,
        auth: ptAuth,
        admin: ptAdmin,
        interview: ptInterview,
      },
      en: {
        landing: enLanding,
        staticPages: enStaticPages,
        auth: enAuth,
        admin: enAdmin,
        interview: enInterview,
      },
    },
    fallbackLng: "en",
    supportedLngs: ["pt", "en"],
    ns: ["landing", "staticPages", "auth", "admin", "interview"],
    defaultNS: "landing",
    interpolation: {
      escapeValue: false,
    },
  });

  initialized = true;
}

export function i18nT(
  locale: string,
  namespace: I18nNamespace,
  key: string,
  options?: Record<string, unknown>,
): string {
  ensureI18nInitialized();
  return i18n.t(key, {
    ns: namespace,
    lng: normalizeLocale(locale),
    ...options,
  });
}

export function i18nTObject<T>(
  locale: string,
  namespace: I18nNamespace,
  key: string,
  options?: Record<string, unknown>,
): T {
  ensureI18nInitialized();
  return i18n.t(key, {
    ns: namespace,
    lng: normalizeLocale(locale),
    returnObjects: true,
    ...options,
  }) as T;
}
