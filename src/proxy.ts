import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { isMutationMethod, passesCsrfProtection, withSecurityHeaders } from "@/lib/security";

const AUTH_COOKIE = "auth_token";

function nextWithSecurityHeaders() {
  return withSecurityHeaders(NextResponse.next());
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return withSecurityHeaders(NextResponse.redirect(url));
}

async function readRoleFromToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
  const { payload } = await jwtVerify(token, secret);
  return payload?.role as string | undefined;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicPage = pathname === "/login" || pathname === "/register" || pathname === "/swagger";
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isOpenApiSpec = pathname === "/api/openapi";
  const isPublicAsset =
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/swagger-ui.html" ||
    pathname.startsWith("/uploads/");
  const isApi = pathname.startsWith("/api/");
  const isMutation = isMutationMethod(req.method);

  if (isPublicAsset || isPublicPage || isOpenApiSpec) {
    return nextWithSecurityHeaders();
  }

  if (isApi && isMutation && !passesCsrfProtection(req)) {
    return withSecurityHeaders(
      NextResponse.json({ error: "CSRF provera nije prosla." }, { status: 403 })
    );
  }

  if (isAuthApi) {
    return nextWithSecurityHeaders();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return redirectToLogin(req);

  if (isApi && isMutation) {
    try {
      await readRoleFromToken(token);
      return nextWithSecurityHeaders();
    } catch {
      return withSecurityHeaders(
        NextResponse.json({ error: "Nevalidan token." }, { status: 401 })
      );
    }
  }

  return nextWithSecurityHeaders();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
