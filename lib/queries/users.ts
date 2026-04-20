import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  const [rows] = await query<UserRecord>(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [normalizedEmail],
  );

  return rows[0] || null;
}

export async function ensureUserByEmail(email: string): Promise<UserRecord> {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email de utilizador inválido");
  }

  const existing = await getUserByEmail(normalizedEmail);
  if (existing) return existing;

  const id = uuidv4();
  await query(
    `
    INSERT INTO users (id, email, name)
    VALUES (?, ?, ?)
    `,
    [id, normalizedEmail, normalizedEmail],
  );

  const created = await getUserByEmail(normalizedEmail);
  if (!created) {
    throw new Error("Utilizador criado mas não encontrado");
  }

  return created;
}
