import { randomBytes } from "crypto";

export const GOOGLE_OAUTH_STATE_COOKIE = "MatchWorky_google_oauth_state";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

function getGoogleClientId(): string {
  return String(process.env.GOOGLE_CLIENT_ID || "").trim();
}

function getGoogleClientSecret(): string {
  return String(process.env.GOOGLE_CLIENT_SECRET || "").trim();
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

export function createGoogleOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function buildGoogleAuthorizationUrl(params: {
  redirectUri: string;
  state: string;
}): string {
  const searchParams = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: params.state,
    prompt: "select_account",
    access_type: "online",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;
}

export async function exchangeGoogleCodeForToken(params: {
  code: string;
  redirectUri: string;
}): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code: params.code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Google token exchange failed: ${errorPayload}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Google userinfo failed: ${errorPayload}`);
  }

  return (await response.json()) as GoogleUserInfo;
}
