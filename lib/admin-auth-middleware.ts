import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth-shared";

type MiddlewareAdminTokenPayload = {
  userId: string;
  email: string;
  role: "admin";
  iat: number;
  exp: number;
};

export { ADMIN_SESSION_COOKIE };

function getAuthSecretForMiddleware(): string {
  const secret =
    (process.env.AUTH_SECRET || "").trim() ||
    (process.env.NEXTAUTH_SECRET || "").trim() ||
    (process.env.ADMIN_PASSWORD || "").trim();

  return secret || "dev-insecure-auth-secret-change-me";
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signPayloadForMiddleware(payloadBase64: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecretForMiddleware()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadBase64),
  );

  return encodeBase64Url(new Uint8Array(signatureBuffer));
}

async function isValidSignature(
  payloadBase64: string,
  receivedSignature: string,
): Promise<boolean> {
  const expectedSignature = await signPayloadForMiddleware(payloadBase64);
  return expectedSignature === receivedSignature;
}

export async function parseAdminTokenForMiddleware(
  token: string | undefined,
) : Promise<MiddlewareAdminTokenPayload | null> {
  if (!token) return null;

  try {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;

    const signatureValid = await isValidSignature(payloadBase64, signature);
    if (!signatureValid) {
      return null;
    }

    const decoded = decodeBase64Url(payloadBase64);
    const parsed = JSON.parse(decoded) as Partial<MiddlewareAdminTokenPayload>;

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
}
