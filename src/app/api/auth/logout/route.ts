import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { CSRF_COOKIE, getAuthCookieOptions, getCsrfCookieOptions } from "@/lib/security";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { ...getAuthCookieOptions(), maxAge: 0 });
  res.cookies.set(CSRF_COOKIE, "", { ...getCsrfCookieOptions(), maxAge: 0 });
  return res;
}
