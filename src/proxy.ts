import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  applySecurityHeaders,
  ensureCsrfCookie,
  hasValidCsrfToken,
  hasValidSameOrigin,
} from "@/lib/security";

const AUTH_COOKIE = "auth_token";

function finalizeResponse(req: NextRequest, res: NextResponse) {
  applySecurityHeaders(res);
  ensureCsrfCookie(req, res);
  return res;
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return finalizeResponse(req, NextResponse.redirect(url));
}

async function readRoleFromToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
  const { payload } = await jwtVerify(token, secret);
  return payload?.role as string | undefined;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicPage = pathname === "/login" || pathname === "/register";
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isPublicAsset = pathname.startsWith("/_next/") || pathname === "/favicon.ico";
  const isApi = pathname.startsWith("/api/");
  const isMutation = req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";

  if (isPublicAsset) {
    const res = NextResponse.next();
    applySecurityHeaders(res);
    return res;
  }

  if (isAuthApi || isPublicPage) {
    return finalizeResponse(req, NextResponse.next());
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return redirectToLogin(req);

  if (isApi && isMutation) {
    if (!hasValidSameOrigin(req) && !hasValidCsrfToken(req)) {
      return finalizeResponse(
        req,
        NextResponse.json({ error: "Neispravan CSRF zahtev." }, { status: 403 })
      );
    }

    try {
      await readRoleFromToken(token);
      return finalizeResponse(req, NextResponse.next());
    } catch {
      return finalizeResponse(
        req,
        NextResponse.json({ error: "Nevalidan token." }, { status: 401 })
      );
    }
  }

  return finalizeResponse(req, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
