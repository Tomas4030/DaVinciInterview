import { i18nT, i18nTObject } from "@/lib/i18n/core";

export function tInterview(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): string {
  return i18nT(locale, "interview", key, options);
}

export function tInterviewObject<T>(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): T {
  return i18nTObject<T>(locale, "interview", key, options);
}
