import i18next from "i18next";
import enLanding from "@/locales/en/landing.json";
import ptLanding from "@/locales/pt/landing.json";
import brLanding from "@/locales/br/landing.json";
import esLanding from "@/locales/es/landing.json";
import deLanding from "@/locales/de/landing.json";
import itLanding from "@/locales/it/landing.json";
import zhLanding from "@/locales/zh/landing.json";
import enStaticPages from "@/locales/en/static-pages.json";
import ptStaticPages from "@/locales/pt/static-pages.json";
import brStaticPages from "@/locales/br/static-pages.json";
import esStaticPages from "@/locales/es/static-pages.json";
import deStaticPages from "@/locales/de/static-pages.json";
import itStaticPages from "@/locales/it/static-pages.json";
import zhStaticPages from "@/locales/zh/static-pages.json";
import enAuth from "@/locales/en/auth.json";
import ptAuth from "@/locales/pt/auth.json";
import brAuth from "@/locales/br/auth.json";
import esAuth from "@/locales/es/auth.json";
import deAuth from "@/locales/de/auth.json";
import itAuth from "@/locales/it/auth.json";
import zhAuth from "@/locales/zh/auth.json";
import enAdmin from "@/locales/en/admin.json";
import ptAdmin from "@/locales/pt/admin.json";
import brAdmin from "@/locales/br/admin.json";
import esAdmin from "@/locales/es/admin.json";
import deAdmin from "@/locales/de/admin.json";
import itAdmin from "@/locales/it/admin.json";
import zhAdmin from "@/locales/zh/admin.json";
import enInterview from "@/locales/en/interview.json";
import ptInterview from "@/locales/pt/interview.json";
import brInterview from "@/locales/br/interview.json";
import esInterview from "@/locales/es/interview.json";
import deInterview from "@/locales/de/interview.json";
import itInterview from "@/locales/it/interview.json";
import zhInterview from "@/locales/zh/interview.json";
import { DEFAULT_LOCALE, normalizeLocale, SUPPORTED_LOCALES } from "@/lib/i18n/locales";

type I18nNamespace =
  | "landing"
  | "staticPages"
  | "auth"
  | "admin"
  | "interview";

const i18n = i18next.createInstance();
let initialized = false;

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
      br: {
        landing: brLanding,
        staticPages: brStaticPages,
        auth: brAuth,
        admin: brAdmin,
        interview: brInterview,
      },
      es: {
        landing: esLanding,
        staticPages: esStaticPages,
        auth: esAuth,
        admin: esAdmin,
        interview: esInterview,
      },
      de: {
        landing: deLanding,
        staticPages: deStaticPages,
        auth: deAuth,
        admin: deAdmin,
        interview: deInterview,
      },
      it: {
        landing: itLanding,
        staticPages: itStaticPages,
        auth: itAuth,
        admin: itAdmin,
        interview: itInterview,
      },
      zh: {
        landing: zhLanding,
        staticPages: zhStaticPages,
        auth: zhAuth,
        admin: zhAdmin,
        interview: zhInterview,
      },
    },
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
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
