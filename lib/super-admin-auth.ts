import { createHmac, timingSafeEqual } from "crypto";
import { verifyPassword } from "@/lib/password";
import {
  SUPER_ADMIN_SESSION_COOKIE,
  SUPER_ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/lib/super-admin-auth-shared";
import {
  countActiveSuperAdmins,
  createSuperAdmin,
  findSuperAdminByEmail,
  touchSuperAdminLastLogin,
} from "@/lib/queries/super-admins";

export { SUPER_ADMIN_SESSION_COOKIE };

type SuperAdminTokenPayload = {
  superAdminId: string;
  email: string;
  role: "super_admin";
  iat: number;
  exp: number;
};

function getAuthSecret(): string {
  const secret =
    (process.env.AUTH_SECRET || "").trim() ||
    (process.env.NEXTAUTH_SECRET || "").trim() ||
    "dev-insecure-auth-secret-change-me";
  return secret;
}

function signPayload(payloadBase64: string): string {
  return createHmac("sha256", getAuthSecret())
    .update(payloadBase64)
    .digest("base64url");
}

export function createSuperAdminToken(email: string, superAdminId: string): string {
  const iat = Date.now();
  const payload: SuperAdminTokenPayload = {
    superAdminId: String(superAdminId || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    role: "super_admin",
    iat,
    exp: iat + SUPER_ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function parseSuperAdminToken(token: string | undefined): SuperAdminTokenPayload | null {
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
    const parsed = JSON.parse(decoded) as Partial<SuperAdminTokenPayload>;

    if (
      parsed.role !== "super_admin" ||
      !parsed.email ||
      !parsed.superAdminId ||
      !parsed.iat ||
      !parsed.exp
    ) {
      return null;
    }

    if (Date.now() > parsed.exp) {
      return null;
    }

    return {
      superAdminId: parsed.superAdminId,
      email: parsed.email,
      role: "super_admin",
      iat: parsed.iat,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export async function verifySuperAdminCredentials(email: string, password: string): Promise<{
  id: string;
  email: string;
  name: string;
} | null> {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");
  let superAdmin = await findSuperAdminByEmail(normalizedEmail);

  if (!superAdmin) {
    const activeCount = await countActiveSuperAdmins();
    const seedEmail = String(process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
    const seedPassword = String(process.env.SUPER_ADMIN_PASSWORD || "");
    const seedName = String(process.env.SUPER_ADMIN_NAME || "Super Admin").trim() || "Super Admin";

    if (
      activeCount === 0 &&
      seedEmail &&
      seedPassword &&
      normalizedEmail === seedEmail &&
      normalizedPassword === seedPassword
    ) {
      superAdmin = await createSuperAdmin({
        email: seedEmail,
        name: seedName,
        password: seedPassword,
      });
    }
  }

  if (!superAdmin) {
    return null;
  }

  const isValidPassword = verifyPassword(normalizedPassword, superAdmin.password_hash);
  if (!isValidPassword) {
    return null;
  }

  await touchSuperAdminLastLogin(superAdmin.id);

  return {
    id: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
  };
}

export function getSuperAdminSessionMaxAgeSeconds(): number {
  return SUPER_ADMIN_SESSION_MAX_AGE_SECONDS;
}
