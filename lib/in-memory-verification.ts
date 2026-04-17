import crypto from "crypto";

type VerificationCodeRecord = {
  code: string;
  expiresAt: number;
};

type LocalSessionRecord = {
  session_token: string;
  email: string;
  telefone: string;
  vaga_id: string;
  expires_at: string;
};

declare global {
  var __verificationCodeStore:
    | Map<string, VerificationCodeRecord>
    | undefined;
  var __localSessionStore: Map<string, LocalSessionRecord> | undefined;
}

const verificationCodeStore =
  global.__verificationCodeStore ?? new Map<string, VerificationCodeRecord>();
const localSessionStore =
  global.__localSessionStore ?? new Map<string, LocalSessionRecord>();

if (process.env.NODE_ENV !== "production") {
  global.__verificationCodeStore = verificationCodeStore;
  global.__localSessionStore = localSessionStore;
}

export function saveLocalVerificationCode(
  email: string,
  code: string,
  ttlMinutes = 15,
) {
  verificationCodeStore.set(email, {
    code,
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  });
}

export function verifyLocalVerificationCode(email: string, code: string) {
  const record = verificationCodeStore.get(email);
  if (!record) return false;

  if (record.expiresAt <= Date.now()) {
    verificationCodeStore.delete(email);
    return false;
  }

  if (record.code !== code) return false;

  verificationCodeStore.delete(email);
  return true;
}

export function createLocalSession(
  email: string,
  telefone: string,
  vaga_id: string,
  ttlMinutes = 15,
) {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  localSessionStore.set(sessionToken, {
    session_token: sessionToken,
    email,
    telefone,
    vaga_id,
    expires_at: expiresAt,
  });

  return {
    sessionToken,
    expiresAt,
  };
}

export function validateLocalSession(sessionToken: string) {
  const record = localSessionStore.get(sessionToken);
  if (!record) return null;

  if (new Date(record.expires_at).getTime() <= Date.now()) {
    localSessionStore.delete(sessionToken);
    return null;
  }

  return record;
}