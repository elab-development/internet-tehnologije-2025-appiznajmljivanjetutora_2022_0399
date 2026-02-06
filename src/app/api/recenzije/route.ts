import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = {
  rezervacijaId: number;
  ocena: number;
  komentar?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rezervacijaId = searchParams.get("rezervacijaId");
  const tutorId = searchParams.get("tutorId");
  const ucenikId = searchParams.get("ucenikId");

  if (tutorId) {
    const recenzije = await db
      .select({
        recenzijaId: schema.recenzija.recenzijaId,
        rezervacijaId: schema.recenzija.rezervacijaId,
        ocena: schema.recenzija.ocena,
        komentar: schema.recenzija.komentar,
        datum: schema.termin.datum,
        vremeOd: schema.termin.vremeOd,
        vremeDo: schema.termin.vremeDo,
        ucenikIme: schema.korisnik.ime,
        ucenikPrezime: schema.korisnik.prezime,
      })
      .from(schema.recenzija)
      .innerJoin(
        schema.rezervacija,
        eq(schema.rezervacija.rezervacijaId, schema.recenzija.rezervacijaId)
      )
      .innerJoin(schema.termin, eq(schema.termin.terminId, schema.rezervacija.terminId))
      .innerJoin(schema.korisnik, eq(schema.korisnik.korisnikId, schema.rezervacija.ucenikId))
      .where(eq(schema.termin.tutorId, Number(tutorId)));

    return NextResponse.json({ recenzije }, { status: 200 });
  }

  if (ucenikId) {
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
        tutorIme: schema.korisnik.ime,
        tutorPrezime: schema.korisnik.prezime,
      })
      .from(schema.recenzija)
      .innerJoin(
        schema.rezervacija,
        eq(schema.rezervacija.rezervacijaId, schema.recenzija.rezervacijaId)
      )
      .innerJoin(schema.termin, eq(schema.termin.terminId, schema.rezervacija.terminId))
      .innerJoin(schema.korisnik, eq(schema.korisnik.korisnikId, schema.termin.tutorId))
      .where(eq(schema.rezervacija.ucenikId, Number(ucenikId)));

    return NextResponse.json({ recenzije }, { status: 200 });
  }

  const where = and(
    rezervacijaId
      ? eq(schema.recenzija.rezervacijaId, Number(rezervacijaId))
      : undefined
  );

  const recenzije = await db
    .select({
      recenzijaId: schema.recenzija.recenzijaId,
      rezervacijaId: schema.recenzija.rezervacijaId,
      ocena: schema.recenzija.ocena,
      komentar: schema.recenzija.komentar,
    })
    .from(schema.recenzija)
    .where(where);

  return NextResponse.json({ recenzije }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "UCENIK" && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da ostavite recenziju." }, { status: 403 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body?.rezervacijaId || !body?.ocena) {
    return NextResponse.json(
      { error: "Rezervacija ID i ocena su obavezni." },
      { status: 400 }
    );
  }

  const rezervacija = await db.query.rezervacija.findFirst({
    where: eq(schema.rezervacija.rezervacijaId, body.rezervacijaId),
    columns: { status: true, ucenikId: true, terminId: true },
  });
  if (!rezervacija) {
    return NextResponse.json({ error: "Rezervacija ne postoji." }, { status: 404 });
  }
  if (rezervacija.status !== "ODRZANA") {
    return NextResponse.json(
      { error: "Recenziju možete ostaviti tek nakon održanog časa." },
      { status: 409 }
    );
  }
  if (auth.role === "UCENIK" && rezervacija.ucenikId !== auth.korisnikId) {
    return NextResponse.json({ error: "Nemate pravo za ovu rezervaciju." }, { status: 403 });
  }

  const existing = await db.query.recenzija.findFirst({
    where: eq(schema.recenzija.rezervacijaId, body.rezervacijaId),
    columns: { recenzijaId: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Recenzija već postoji." }, { status: 409 });
  }

  await db.insert(schema.recenzija).values({
    rezervacijaId: body.rezervacijaId,
    ocena: body.ocena,
    komentar: body.komentar ?? null,
  });

  const termin = await db.query.termin.findFirst({
    where: eq(schema.termin.terminId, rezervacija.terminId),
    columns: { tutorId: true },
  });
  if (termin?.tutorId) {
    const avgRow = await db
      .select({ avg: sql<number>`avg(${schema.recenzija.ocena})` })
      .from(schema.recenzija)
      .innerJoin(
        schema.rezervacija,
        eq(schema.rezervacija.rezervacijaId, schema.recenzija.rezervacijaId)
      )
      .innerJoin(schema.termin, eq(schema.termin.terminId, schema.rezervacija.terminId))
      .where(eq(schema.termin.tutorId, termin.tutorId));

    const avg = Number(avgRow[0]?.avg ?? 0);
    await db
      .update(schema.tutor)
      .set({ prosecnaOcena: avg.toFixed(2) })
      .where(eq(schema.tutor.korisnikId, termin.tutorId));
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
