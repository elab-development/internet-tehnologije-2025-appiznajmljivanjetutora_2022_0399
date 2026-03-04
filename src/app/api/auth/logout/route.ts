// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { clearAuthCookieOptions } from "@/lib/cookie-options";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", clearAuthCookieOptions);
  return res;
}
