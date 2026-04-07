// lib/admin-auth.ts
const ADMIN_EMAIL = "admin@davincinterviews.com";
const ADMIN_PASSWORD = "DaVinci@2026Secure!";

export const verifyAdminCredentials = (
  email: string,
  password: string,
): boolean => {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
};

export const getAdminCredentials = () => ({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
});
