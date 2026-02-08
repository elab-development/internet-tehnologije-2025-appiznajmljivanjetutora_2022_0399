import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "auth_token";

//preusmerava na login ako nema tokena, ili ako je token nevalidan (samo za API mutacije), 
//ili ako korisnik bez role UCENIK pokusa da pristupi /tutors stranici
function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

//baca izuzetak ako token nije validan, cita samo rolu iz tokena 
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

  //za javne stranice, javne API-je i statičke resurse ne proverava token
  if (isPublicAsset || isAuthApi || isPublicPage) {
    return NextResponse.next();
  }

 // Ako korisnik nije prijavljen, preusmeri na login
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return redirectToLogin(req);

  // Za API mutacije uvek traži validan token
  if (isApi && isMutation) {
    try {
      await readRoleFromToken(token);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Nevalidan token." }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
