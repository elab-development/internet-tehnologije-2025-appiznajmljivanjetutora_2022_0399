//  neulogovan ne moze nigde osim login/register 
// Plus: /tutors sme samo UCENIK.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "auth_token"; // mora da se poklapa sa AUTH_COOKIE u lib/auth.ts
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const PROTECTED_API_PREFIXES = ["/api/termini", "/api/rezervacije", "/api/recenzije"];

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

async function readRoleFromToken(token: string) {
  const secret =new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

  if (!secret) throw new Error("Nema JWT/AUTH secret u env-u");

  const { payload } = await jwtVerify(
    token, secret
  );

  // Ocekivano: payload.role = "UCENIK" | "TUTOR" | "ADMIN"
  return payload?.role as string | undefined;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // javno dozvoljeno
  const isPublicPage = pathname === "/login" || pathname === "/register";
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublicAsset =
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  if (isPublicAsset || isAuthApi || isPublicPage) {
    return NextResponse.next();
  }

  // API: samo mutacije zahtevaju auth
  if (isProtectedApi && !SAFE_METHODS.has(req.method)) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
    }

    try {
      await readRoleFromToken(token);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Nevalidan token." }, { status: 401 });
    }
  }

  // sve ostalo je privatno
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return redirectToLogin(req);

  // Tutors-only: UCENIK
  if (pathname.startsWith("/tutors")) {
    try {
      const role = await readRoleFromToken(token);
      if (role !== "UCENIK") {
        const url = req.nextUrl.clone();
        url.pathname = "/me";
        return NextResponse.redirect(url);
      }
    } catch {
      return redirectToLogin(req);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Primeni middleware na sve osim statickih fajlova
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
