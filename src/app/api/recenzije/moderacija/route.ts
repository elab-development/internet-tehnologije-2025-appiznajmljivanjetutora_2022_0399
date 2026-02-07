import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ recenzije: [] }, { status: 200 });
  }

  const tutorKorisnik = alias(schema.korisnik, "tutorKorisnik");
  const ucenikKorisnik = alias(schema.korisnik, "ucenikKorisnik");

  const recenzije = await db
    .select({
      recenzijaId: schema.recenzija.recenzijaId,
      rezervacijaId: schema.recenzija.rezervacijaId,
      ocena: schema.recenzija.ocena,
      komentar: schema.recenzija.komentar,
      datum: schema.termin.datum,
      vremeOd: schema.termin.vremeOd,
      vremeDo: schema.termin.vremeDo,
      tutorId: schema.termin.tutorId,
      tutorIme: tutorKorisnik.ime,
      tutorPrezime: tutorKorisnik.prezime,
      ucenikId: schema.rezervacija.ucenikId,
      ucenikIme: ucenikKorisnik.ime,
      ucenikPrezime: ucenikKorisnik.prezime,
    })
    .from(schema.recenzija)
    .innerJoin(
      schema.rezervacija,
      eq(schema.rezervacija.rezervacijaId, schema.recenzija.rezervacijaId)
    )
    .innerJoin(schema.termin, eq(schema.termin.terminId, schema.rezervacija.terminId))
    .innerJoin(ucenikKorisnik, eq(ucenikKorisnik.korisnikId, schema.rezervacija.ucenikId))
    .innerJoin(tutorKorisnik, eq(tutorKorisnik.korisnikId, schema.termin.tutorId))
    .orderBy(desc(schema.recenzija.recenzijaId));

  return NextResponse.json({ recenzije }, { status: 200 });
}
