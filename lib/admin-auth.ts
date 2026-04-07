// lib/admin-auth.ts
export const ADMIN_SESSION_COOKIE = "davinci_admin_session";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@davincinterviews.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

type AdminTokenPayload = {
  email: string;
  role: "admin";
  iat: number;
};

export const verifyAdminCredentials = (
  email: string,
  password: string,
): boolean => {
  return (
    String(email).trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD
  );
};

export const createAdminToken = (email: string): string => {
  const payload: AdminTokenPayload = {
    email: String(email).trim().toLowerCase(),
    role: "admin",
    iat: Date.now(),
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

    if (parsed.role !== "admin" || !parsed.email || !parsed.iat) {
      return null;
    }

    if (parsed.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return null;
    }

    return {
      email: parsed.email,
      role: "admin",
      iat: parsed.iat,
    };
  } catch {
    return null;
  }
};

export const getAdminCredentials = () => ({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
});
