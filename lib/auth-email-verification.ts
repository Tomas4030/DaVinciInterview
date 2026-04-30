import crypto from "crypto";

type AuthAction = "signup" | "login";

type ChallengePayload = {
  action: AuthAction;
  email: string;
  password: string;
  name?: string | null;
  next?: string;
};

type ChallengeRecord = {
  code: string;
  expiresAt: number;
  payload: ChallengePayload;
};

declare global {
  var __authEmailChallengeStore: Map<string, ChallengeRecord> | undefined;
}

const challengeStore =
  global.__authEmailChallengeStore ?? new Map<string, ChallengeRecord>();

if (process.env.NODE_ENV !== "production") {
  global.__authEmailChallengeStore = challengeStore;
}

export function createAuthEmailChallenge(
  payload: ChallengePayload,
  ttlMinutes = 15,
) {
  const challengeId = crypto.randomUUID();
  const code = String(Math.floor(100000 + Math.random() * 900000));

  challengeStore.set(challengeId, {
    code,
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    payload,
  });

  return { challengeId, code };
}

export function verifyAuthEmailChallenge(challengeId: string, code: string) {
  const record = challengeStore.get(challengeId);
  if (!record) return null;

  if (record.expiresAt <= Date.now()) {
    challengeStore.delete(challengeId);
    return null;
  }

  if (record.code !== code) {
    return null;
  }

  challengeStore.delete(challengeId);
  return record.payload;
}
