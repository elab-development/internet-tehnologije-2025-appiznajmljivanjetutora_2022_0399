import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { getAuthCookieOptions } from "@/lib/security";

type Body = {
  ime: string;
  prezime: string;
  email: string;
  lozinka: string;
  role: "UCENIK" | "TUTOR";
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body?.email || !body?.lozinka || !body?.ime || !body?.prezime || !body?.role) {
    return NextResponse.json({ error: "Nedostaju podaci." }, { status: 400 });
  }

  const existing = await db.query.korisnik.findFirst({
    where: eq(schema.korisnik.email, body.email),
    columns: { korisnikId: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Email je vec zauzet." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(body.lozinka, 10);
  const insertResult = await db.insert(schema.korisnik).values({
    ime: body.ime,
    prezime: body.prezime,
    email: body.email,
    lozinka: hashed,
    statusNaloga: "AKTIVAN",
  });

  const korisnikId = Number(insertResult[0].insertId);
  if (body.role === "UCENIK") {
    await db.insert(schema.ucenik).values({
      korisnikId,
      ukupanBrojCasova: 0,
    });
  } else {
    await db.insert(schema.tutor).values({
      korisnikId,
      biografija: null,
      cenaPoCasu: "0.00",
      verifikovan: false,
      prosecnaOcena: "0.00",
    });
  }

  const token = await signToken({ korisnikId, role: body.role });
  const res = NextResponse.json(
    { korisnikId, role: body.role, email: body.email, ime: body.ime, prezime: body.prezime },
    { status: 201 }
  );

  res.cookies.set(AUTH_COOKIE, token, getAuthCookieOptions());
  return res;
}
