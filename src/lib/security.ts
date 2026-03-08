import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const CSRF_COOKIE = "csrf_token";
const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function createCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction(),
    path: "/",
    maxAge: WEEK_IN_SECONDS,
  };
}

export function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "strict" as const,
    secure: isProduction(),
    path: "/",
    maxAge: WEEK_IN_SECONDS,
  };
}

export function applySecurityHeaders(res: NextResponse) {
  const devScriptSrc = isProduction() ? "" : " 'unsafe-eval'";
  const connectSrc = isProduction() ? "connect-src 'self'" : "connect-src 'self' ws: wss:";

  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${devScriptSrc} https://unpkg.com`,
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      connectSrc,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
}

export function ensureCsrfCookie(req: NextRequest, res: NextResponse) {
  const existingToken = req.cookies.get(CSRF_COOKIE)?.value;
  if (existingToken) return;
  res.cookies.set(CSRF_COOKIE, createCsrfToken(), getCsrfCookieOptions());
}

export function hasValidSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return origin === req.nextUrl.origin;
}

export function hasValidCsrfToken(req: NextRequest) {
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get("x-csrf-token");
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}
