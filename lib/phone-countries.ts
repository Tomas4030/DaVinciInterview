import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

export type PhoneCountryOption = {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
};

function countryCodeToFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function getCountryName(code: CountryCode) {
  try {
    const names = new Intl.DisplayNames(["pt-PT"], { type: "region" });
    return names.of(code) || code;
  } catch {
    return code;
  }
}

export function getPhoneCountryOptions(): PhoneCountryOption[] {
  return getCountries()
    .map((code) => ({
      code: code as CountryCode,
      name: getCountryName(code as CountryCode),
      callingCode: `+${getCountryCallingCode(code as CountryCode)}`,
      flag: countryCodeToFlag(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-PT"));
}
