// app/api/me/route.ts
import { NextResponse } from "next/server";import { getAuthPayload } from "@/lib/auth-server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const payload = await getAuthPayload();

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await db.query.korisnik.findFirst({
    where: eq(schema.korisnik.korisnikId, payload.korisnikId),
    columns: {
      korisnikId: true,
      ime: true,
      prezime: true,
      email: true,
      statusNaloga: true,
    },
  });
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  //vracamo podatke o korisniku (korisnikId, ime, prezime, email, statusNaloga) i rolu iz tokena
  return NextResponse.json(
    { user: { ...user, role: payload.role } },
    { status: 200 }
  );

}
