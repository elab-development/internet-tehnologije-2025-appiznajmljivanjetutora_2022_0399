import { NextResponse, type NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function isMutationMethod(method: string) {
  return !SAFE_METHODS.has(method.toUpperCase());
}

export function withSecurityHeaders(res: NextResponse) {
  res.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

function hostMatches(urlValue: string | null, host: string | null) {
  if (!urlValue || !host) return false;
  try {
    return new URL(urlValue).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function passesCsrfProtection(req: NextRequest) {
  if (!isMutationMethod(req.method)) return true;

  const requestHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const origin = req.headers.get("origin");
  if (origin && hostMatches(origin, requestHost)) return true;

  const referer = req.headers.get("referer");
  if (referer && hostMatches(referer, requestHost)) return true;

  return false;
}
