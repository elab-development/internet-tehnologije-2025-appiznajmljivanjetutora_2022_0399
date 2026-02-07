import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ users: [] }, { status: 200 });
  }

  const users = await db
    .select({
      korisnikId: schema.korisnik.korisnikId,
      ime: schema.korisnik.ime,
      prezime: schema.korisnik.prezime,
      email: schema.korisnik.email,
      statusNaloga: schema.korisnik.statusNaloga,
      isTutor: schema.tutor.korisnikId,
      isUcenik: schema.ucenik.korisnikId,
      isAdmin: schema.administrator.korisnikId,
    })
    .from(schema.korisnik)
    .leftJoin(schema.tutor, eq(schema.tutor.korisnikId, schema.korisnik.korisnikId))
    .leftJoin(schema.ucenik, eq(schema.ucenik.korisnikId, schema.korisnik.korisnikId))
    .leftJoin(
      schema.administrator,
      eq(schema.administrator.korisnikId, schema.korisnik.korisnikId)
    );

  const mapped = users.map((u) => ({
    korisnikId: u.korisnikId,
    ime: u.ime,
    prezime: u.prezime,
    email: u.email,
    statusNaloga: u.statusNaloga,
    role: u.isAdmin
      ? "ADMIN"
      : u.isTutor
        ? "TUTOR"
        : u.isUcenik
          ? "UCENIK"
          : "KORISNIK",
  }));

  return NextResponse.json({ users: mapped }, { status: 200 });
}
