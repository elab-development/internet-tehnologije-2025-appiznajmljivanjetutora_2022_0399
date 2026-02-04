// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { getRoleForUser } from "@/lib/role";

type Body = { email: string; lozinka: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  if (!body?.email || !body?.lozinka) {
    return NextResponse.json({ error: "Email i lozinka su obavezni." }, { status: 400 });
  }

  const user = await db.query.korisnik.findFirst({
    where: eq(schema.korisnik.email, body.email),
  });

  if (!user) {
    return NextResponse.json({ error: "Pogrešan email ili lozinka." }, { status: 401 });
  }

  if (user.statusNaloga !== "AKTIVAN") {
    return NextResponse.json({ error: "Nalog je blokiran." }, { status: 403 });
  }

  const ok = await bcrypt.compare(body.lozinka, user.lozinka);
  if (!ok) {
    return NextResponse.json({ error: "Pogrešan email ili lozinka." }, { status: 401 });
  }

  const role = await getRoleForUser(user.korisnikId);

  const token = await signToken({ korisnikId: user.korisnikId, role });

  const res = NextResponse.json(
    { korisnikId: user.korisnikId, role, email: user.email, ime: user.ime, prezime: user.prezime },
    { status: 200 }
  );

  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
