// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  //istek tokena odmah (maxAge: 0) i obrisemo cookie na clientu
  res.cookies.set(
    AUTH_COOKIE, 
  //token moze biti bilo sta, bitno je da se obrise sa maxAge: 0
    "", 
    { path: "/", maxAge: 0 });
  return res;
}
