// lib/validation.ts
import {
  CountryCode,
  getCountries,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

export type SupportedPhoneCountry = CountryCode;

export const SUPPORTED_PHONE_COUNTRIES: SupportedPhoneCountry[] = getCountries();

type PhoneValidationResult =
  | {
      isValid: true;
      e164: string;
    }
  | {
      isValid: false;
      reason: "invalid" | "format";
    };

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isSupportedPhoneCountry = (
  country: string,
): country is SupportedPhoneCountry => {
  return getCountries().includes(country as SupportedPhoneCountry);
};

export const validatePhoneNumberForCountry = (
  phone: string,
  country: SupportedPhoneCountry,
): PhoneValidationResult => {
  const trimmedPhone = String(phone || "").trim();

  if (!trimmedPhone) {
    return { isValid: false, reason: "format" };
  }

  const parsedPhone = parsePhoneNumberFromString(trimmedPhone, country);

  if (!parsedPhone) {
    return { isValid: false, reason: "format" };
  }

  if (parsedPhone.country && parsedPhone.country !== country) {
    return { isValid: false, reason: "format" };
  }

  if (!parsedPhone.isValid()) {
    return { isValid: false, reason: "invalid" };
  }

  return { isValid: true, e164: parsedPhone.number };
};

export const isValidPhoneNumber = (
  phone: string,
  country: SupportedPhoneCountry = "PT",
): boolean => {
  return validatePhoneNumberForCountry(phone, country).isValid;
};

export const formatPhoneNumber = (
  phone: string,
  country: SupportedPhoneCountry = "PT",
): string => {
  const result = validatePhoneNumberForCountry(phone, country);
  return result.isValid ? result.e164 : String(phone || "").trim();
};

export const formatPhoneNumberE164 = (
  phone: string,
  country: SupportedPhoneCountry,
): string | null => {
  const result = validatePhoneNumberForCountry(phone, country);
  if (!result.isValid) {
    return null;
  }

  return result.e164;
};

export const formatAnyValidPhoneToE164 = (phone: string): string | null => {
  const trimmedPhone = String(phone || "").trim();
  if (!trimmedPhone) {
    return null;
  }

  const parsedPhone = parsePhoneNumberFromString(trimmedPhone);
  if (!parsedPhone || !parsedPhone.isValid()) {
    return null;
  }

  return parsedPhone.number;
};
