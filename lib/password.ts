import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const normalized = String(password || "");
  if (!normalized) {
    throw new Error("Password inválida");
  }

  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(normalized, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const normalized = String(password || "");
  const serialized = String(storedHash || "");
  const parts = serialized.split("$");

  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, originalHashHex] = parts;

  try {
    const derived = scryptSync(normalized, salt, KEY_LENGTH);
    const original = Buffer.from(originalHashHex, "hex");

    if (derived.length !== original.length) {
      return false;
    }

    return timingSafeEqual(derived, original);
  } catch {
    return false;
  }
}
