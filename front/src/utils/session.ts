import crypto from "crypto";
import type { AstroCookies } from "astro";

// Environment accessors (server-only)
function getCookieSecret(): string {
  const secret = import.meta.env.COOKIE_SECRET as string | undefined;
  if (!secret || secret.length < 16) {
    throw new Error("COOKIE_SECRET is missing or too short");
  }
  return secret;
}

function getSessionMaxAgeSeconds(): number {
  const raw =
    (import.meta.env.SESSION_MAX_AGE_SECONDS as string | undefined) ??
    "2592000";
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 2592000; // 30d
}

function getSessionRenewWindowDays(): number {
  const raw =
    (import.meta.env.SESSION_RENEW_WINDOW_DAYS as string | undefined) ?? "10";
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 10;
}

// 1) UID generation
export function generateUid(): string {
  return crypto.randomBytes(16).toString("hex");
}

// 2) Sign / Verify
export function sign(uid: string, issuedAtUnix: number): string {
  const hmac = crypto.createHmac("sha256", getCookieSecret());
  hmac.update(`${uid}.${issuedAtUnix}`);
  return hmac.digest("hex");
}

// constant-time string comparison (hex-strings)
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function verify(
  uid: string,
  issuedAtUnix: number,
  signature: string
): boolean {
  try {
    const expected = sign(uid, issuedAtUnix);
    return constantTimeEqual(signature, expected);
  } catch {
    return false;
  }
}

// 3) Parse cookie value
export type ParsedSession = { uid: string; issuedAt: number; sig: string };

export function parseUserSession(
  value: string | undefined | null
): ParsedSession | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [uid, issuedAtStr, sig] = parts;
  if (!uid || !sig) return null;
  const issuedAt = Number.parseInt(issuedAtStr, 10);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return null;
  return { uid, issuedAt, sig };
}

// 4) Renew decision: true when remaining time <= renewWindowDays
export function needsRenew(
  issuedAtUnix: number,
  nowUnix: number,
  maxAgeSec = getSessionMaxAgeSeconds(),
  renewWindowDays = getSessionRenewWindowDays()
): boolean {
  const expiresAt = issuedAtUnix + maxAgeSec;
  const remainingSec = expiresAt - nowUnix;
  const windowSec = renewWindowDays * 24 * 60 * 60;
  return remainingSec <= windowSec;
}

// 5) Set-Cookie issuance
export function setUserSession(
  cookies: AstroCookies,
  { uid, issuedAt }: { uid: string; issuedAt: number }
): void {
  const sig = sign(uid, issuedAt);
  const value = `${uid}.${issuedAt}.${sig}`;
  const maxAge = getSessionMaxAgeSeconds();
  cookies.set("user-session", value, {
    httpOnly: true,
    secure: Boolean(import.meta.env.PROD),
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

// Helper to validate and optionally renew; may be used from middleware later
export function verifyCookieValue(
  value: string | undefined | null
): ParsedSession | null {
  const parsed = parseUserSession(value);
  if (!parsed) return null;
  const ok = verify(parsed.uid, parsed.issuedAt, parsed.sig);
  return ok ? parsed : null;
}
