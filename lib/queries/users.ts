import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
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

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return null;

  const [rows] = await query<UserRecord>(
    `SELECT * FROM users WHERE id = ? LIMIT 1`,
    [normalizedUserId],
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

export async function ensureUserByEmailAndName(
  email: string,
  name?: string | null,
): Promise<UserRecord> {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(name || "").trim() || null;
  if (!normalizedEmail) {
    throw new Error("Email de utilizador inválido");
  }

  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    if (!existing.name && normalizedName) {
      await query(
        `
        UPDATE users
        SET name = ?
        WHERE id = ?
        `,
        [normalizedName, existing.id],
      );

      const updated = await getUserByEmail(normalizedEmail);
      if (updated) return updated;
    }

    return existing;
  }

  const id = uuidv4();
  await query(
    `
    INSERT INTO users (id, email, name)
    VALUES (?, ?, ?)
    `,
    [id, normalizedEmail, normalizedName || normalizedEmail],
  );

  const created = await getUserByEmail(normalizedEmail);
  if (!created) {
    throw new Error("Utilizador criado mas não encontrado");
  }

  return created;
}

export async function setUserPasswordHash(
  userId: string,
  passwordHash: string,
): Promise<void> {
  await query(
    `
    UPDATE users
    SET password_hash = ?
    WHERE id = ?
    `,
    [passwordHash, userId],
  );
}

export async function createUserWithPassword(input: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<UserRecord> {
  const normalizedEmail = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const name = String(input.name || "").trim() || null;

  if (!normalizedEmail) {
    throw new Error("Email de utilizador inválido");
  }

  if (password.length < 8) {
    throw new Error("A password deve ter pelo menos 8 caracteres");
  }

  const existing = await getUserByEmail(normalizedEmail);
  if (existing?.password_hash) {
    throw new Error("Já existe um utilizador com este email");
  }

  const passwordHash = hashPassword(password);

  if (existing) {
    await query(
      `
      UPDATE users
      SET name = COALESCE(?, name), password_hash = ?
      WHERE id = ?
      `,
      [name, passwordHash, existing.id],
    );

    const updated = await getUserByEmail(normalizedEmail);
    if (!updated) {
      throw new Error("Utilizador atualizado mas não encontrado");
    }

    return updated;
  }

  const id = uuidv4();
  await query(
    `
    INSERT INTO users (id, email, name, password_hash)
    VALUES (?, ?, ?, ?)
    `,
    [id, normalizedEmail, name, passwordHash],
  );

  const created = await getUserByEmail(normalizedEmail);
  if (!created) {
    throw new Error("Utilizador criado mas não encontrado");
  }

  return created;
}

export async function verifyUserCredentials(
  email: string,
  password: string,
): Promise<UserRecord | null> {
  const user = await getUserByEmail(email);
  if (!user?.password_hash) {
    return null;
  }

  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return user;
}
