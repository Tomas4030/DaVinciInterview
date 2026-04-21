// lib/admin-auth.ts
export const ADMIN_SESSION_COOKIE = "davinci_admin_session";
export const ADMIN_COMPANY_COOKIE = "davinci_admin_company";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@davincinterviews.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

type AdminTokenPayload = {
  userId: string;
  email: string;
  role: "admin";
  iat: number;
  exp: number;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

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

  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

export const parseAdminToken = (
  token: string | undefined,
): AdminTokenPayload | null => {
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
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
