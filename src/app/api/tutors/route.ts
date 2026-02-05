import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, lte, sql } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = {
  korisnikId?: number;
  biografija?: string | null;
  cenaPoCasu?: string;
  verifikovan?: boolean;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const verified = searchParams.get("verified");
  const maxPrice = searchParams.get("maxPrice");
  const languageId = searchParams.get("languageId");
  const levelParam = searchParams.get("level"); // A1..C2
  const levels = new Set<Level>(["A1", "A2", "B1", "B2", "C1", "C2"]);
  const level = levelParam && levels.has(levelParam as Level) ? (levelParam as Level) : null;

  const maxRow = await db
    .select({
      maxPrice: sql<number>`max(${schema.tutor.cenaPoCasu})`,
    })
    .from(schema.tutor);
  const maxPriceValue = Number(maxRow[0]?.maxPrice ?? 0);

  // osnovni uslovi za tutor tabelu
  const tutorWhere = and(
    verified === null
      ? undefined
      : eq(schema.tutor.verifikovan, verified === "true"),
    maxPrice === null
      ? undefined
      : lte(schema.tutor.cenaPoCasu, maxPrice) // drizzle decimal kao string ok
  );

  // ako nema filtera za jezik/nivo, možemo direktno tutor + korisnik
  if (!languageId && !level) {
    const tutors = await db
      .select({
        tutorId: schema.tutor.korisnikId,
        ime: schema.korisnik.ime,
        prezime: schema.korisnik.prezime,
        cenaPoCasu: schema.tutor.cenaPoCasu,
        verifikovan: schema.tutor.verifikovan,
        prosecnaOcena: schema.tutor.prosecnaOcena,
        biografija: schema.tutor.biografija,
      })
      .from(schema.tutor)
      .innerJoin(schema.korisnik, eq(schema.korisnik.korisnikId, schema.tutor.korisnikId))
      .where(tutorWhere);

    return NextResponse.json({ tutors, maxPrice: maxPriceValue }, { status: 200 });
  }

  // ako ima filtera za jezik/nivo, ukljucujemo tutor_jezik
  const tjWhere = and(
    languageId ? eq(schema.tutorJezik.jezikId, Number(languageId)) : undefined,
    level ? eq(schema.tutorJezik.nivo, level) : undefined
  );

  const tutors = await db
    .select({
      tutorId: schema.tutor.korisnikId,
      ime: schema.korisnik.ime,
      prezime: schema.korisnik.prezime,
      cenaPoCasu: schema.tutor.cenaPoCasu,
      verifikovan: schema.tutor.verifikovan,
      prosecnaOcena: schema.tutor.prosecnaOcena,
      biografija: schema.tutor.biografija,
    })
    .from(schema.tutor)
    .innerJoin(schema.korisnik, eq(schema.korisnik.korisnikId, schema.tutor.korisnikId))
    .innerJoin(schema.tutorJezik, eq(schema.tutorJezik.tutorId, schema.tutor.korisnikId))
    .where(and(tutorWhere, tjWhere));

  // zbog join-a moze biti duplikata (ako tutor ima više jezika)
  // skini duplikate po tutorId
  const unique = Array.from(new Map(tutors.map((t) => [t.tutorId, t])).values());

  return NextResponse.json({ tutors: unique, maxPrice: maxPriceValue }, { status: 200 });
}

type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export async function POST(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da kreirate profil." }, { status: 403 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body?.korisnikId) {
    return NextResponse.json({ error: "Korisnik ID je obavezan." }, { status: 400 });
  }

  await db.insert(schema.tutor).values({
    korisnikId: body.korisnikId,
    biografija: body.biografija ?? null,
    cenaPoCasu: body.cenaPoCasu ?? "0.00",
    verifikovan: body.verifikovan ?? false,
    prosecnaOcena: "0.00",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
