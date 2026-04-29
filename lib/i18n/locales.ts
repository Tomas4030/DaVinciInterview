export const SUPPORTED_LOCALES = ["pt", "en", "br", "es", "de", "it", "zh"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export function isSupportedLocale(locale: string): locale is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export function normalizeLocale(locale: string): AppLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}
