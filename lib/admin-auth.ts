// lib/admin-auth.ts  (REPLACE the existing file)
//
// Password login for /admin. Only ONE setting is needed in .env.local:
//
//   ADMIN_PASSWORD=your-password
//
// On success the browser gets a signed, httpOnly cookie (valid 7 days). The cookie is signed
// with a key derived from the password itself, so there is no separate secret to manage —
// and changing the password logs everyone out automatically.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "sb_admin";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7;

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD?.trim();
  return p ? p : null;
}

/** Signing key derived from the password (never the password itself). */
function signingKey(): string | null {
  const p = adminPassword();
  return p
    ? createHash("sha256").update(`steadyball-admin-session:${p}`).digest("hex")
    : null;
}

const safeEqual = (a: Buffer, b: Buffer): boolean =>
  a.length === b.length && timingSafeEqual(a, b);

/** Constant-time password check (hashing first makes the lengths equal). */
export function passwordMatches(input: string): boolean {
  const real = adminPassword();
  if (!real) return false;
  const h = (v: string): Buffer => createHash("sha256").update(v).digest();
  return safeEqual(h(input.trim()), h(real));
}

export function createSessionToken(): string {
  const key = signingKey();
  if (!key) throw new Error("ADMIN_PASSWORD is not set in .env.local");
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_S;
  const payload = `admin.${exp}`;
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const key = signingKey();
  if (!token || !key) return false;
  const cut = token.lastIndexOf(".");
  if (cut <= 0) return false;
  const payload = token.slice(0, cut);
  const signature = token.slice(cut + 1);
  const exp = Number(payload.split(".")[1]);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000))
    return false;
  const expected = createHmac("sha256", key)
    .update(payload)
    .digest("base64url");
  return safeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}
