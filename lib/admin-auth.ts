// lib/admin-auth.ts
import { createHmac, timingSafeEqual } from "crypto";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin-auth-shared";

export { ADMIN_COMPANY_COOKIE, ADMIN_SESSION_COOKIE };

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@MatchWorkynterviews.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

type AdminTokenPayload = {
  userId: string;
  email: string;
  role: "admin";
  iat: number;
  exp: number;
};

function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ADMIN_PASSWORD;
  return secret || "dev-insecure-auth-secret-change-me";
}

function signPayload(payloadBase64: string): string {
  return createHmac("sha256", getAuthSecret())
    .update(payloadBase64)
    .digest("base64url");
}

export const verifyAdminCredentials = (
  email: string,
  password: string,
): boolean => {
  return (
    String(email).trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD
  );
};

export const createAdminToken = (email: string, userId: string): string => {
  const iat = Date.now();
  const payload: AdminTokenPayload = {
    userId: String(userId).trim(),
    email: String(email).trim().toLowerCase(),
    role: "admin",
    iat,
    exp: iat + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
};

export const parseAdminToken = (
  token: string | undefined,
): AdminTokenPayload | null => {
  if (!token) return null;

  try {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) {
      return null;
    }

    const expectedSignature = signPayload(payloadBase64);
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return null;
    }

    const decoded = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded) as Partial<AdminTokenPayload>;

    if (
      parsed.role !== "admin" ||
      !parsed.email ||
      !parsed.userId ||
      !parsed.iat ||
      !parsed.exp
    ) {
      return null;
    }

    if (Date.now() > parsed.exp) {
      return null;
    }

    return {
      userId: parsed.userId,
      email: parsed.email,
      role: "admin",
      iat: parsed.iat,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
};

export const getAdminCredentials = () => ({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
});

export const getSessionMaxAgeSeconds = () => SESSION_MAX_AGE_SECONDS;
