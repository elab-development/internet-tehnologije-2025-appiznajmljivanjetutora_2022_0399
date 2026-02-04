import { NextResponse } from "next/server";
import { db, schema } from "@/src/db";
import { and, eq, lte } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const verified = searchParams.get("verified");
  const maxPrice = searchParams.get("maxPrice");
  const languageId = searchParams.get("languageId");
  const level = searchParams.get("level"); // A1..C2

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

    return NextResponse.json({ tutors }, { status: 200 });
  }

  // ako ima filtera za jezik/nivo, ukljucujemo tutor_jezik
  const tjWhere = and(
    languageId ? eq(schema.tutorJezik.jezikId, Number(languageId)) : undefined,
    level ? eq(schema.tutorJezik.nivo, level as any) : undefined
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

  return NextResponse.json({ tutors: unique }, { status: 200 });
}
