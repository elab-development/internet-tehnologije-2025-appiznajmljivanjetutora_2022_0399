import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "UCENIK") {
    return NextResponse.json({ rezervacije: [] }, { status: 200 });
  }

  await db.execute(sql`
    UPDATE rezervacija r
    JOIN termin t ON r.termin_id = t.termin_id
    SET r.status_rezervacije = 'ODRZANA'
    WHERE r.status_rezervacije = 'AKTIVNA'
      AND TIMESTAMP(t.datum, t.vreme_do) < NOW()
  `);

  const rows = await db
    .select({
      rezervacijaId: schema.rezervacija.rezervacijaId,
      terminId: schema.rezervacija.terminId,
      status: schema.rezervacija.status,
      datum: schema.termin.datum,
      vremeOd: schema.termin.vremeOd,
      vremeDo: schema.termin.vremeDo,
      tutorId: schema.tutor.korisnikId,
      tutorIme: schema.korisnik.ime,
      tutorPrezime: schema.korisnik.prezime,
      cenaPoCasu: schema.tutor.cenaPoCasu,
    })
    .from(schema.rezervacija)
    .innerJoin(schema.termin, eq(schema.termin.terminId, schema.rezervacija.terminId))
    .innerJoin(schema.tutor, eq(schema.tutor.korisnikId, schema.termin.tutorId))
    .innerJoin(schema.korisnik, eq(schema.korisnik.korisnikId, schema.tutor.korisnikId))
    .where(eq(schema.rezervacija.ucenikId, auth.korisnikId));

  return NextResponse.json({ rezervacije: rows }, { status: 200 });
}
