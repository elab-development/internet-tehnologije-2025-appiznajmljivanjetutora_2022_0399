import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type BadgeRule = {
  naziv: string;
  minOdrzani?: number;
  minRezervacije?: number;
  minPetice?: number;
};

const BADGE_RULES: BadgeRule[] = [
  { naziv: "Prvi čas", minOdrzani: 1 },
  { naziv: "Redovan učenik", minOdrzani: 5 },
  { naziv: "Lojalan", minRezervacije: 10 },
  { naziv: "Pet zvezdica", minPetice: 1 },
];

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "UCENIK") {
    return NextResponse.json({ bedzevi: [] }, { status: 200 });
  }

  // Auto-dodela bedzeva na osnovu aktivnosti
  const [stats] = await db
    .select({
      odrzane: sql<number>`count(*)`,
    })
    .from(schema.rezervacija)
    .where(
      and(
        eq(schema.rezervacija.ucenikId, auth.korisnikId),
        eq(schema.rezervacija.status, "ODRZANA")
      )
    );

  const [allReservations] = await db
    .select({
      ukupno: sql<number>`count(*)`,
    })
    .from(schema.rezervacija)
    .where(eq(schema.rezervacija.ucenikId, auth.korisnikId));

  const [fiveStar] = await db
    .select({
      petice: sql<number>`count(*)`,
    })
    .from(schema.recenzija)
    .innerJoin(
      schema.rezervacija,
      eq(schema.rezervacija.rezervacijaId, schema.recenzija.rezervacijaId)
    )
    .where(
      and(
        eq(schema.rezervacija.ucenikId, auth.korisnikId),
        eq(schema.recenzija.ocena, 5)
      )
    );

  const bedzRows = await db.select().from(schema.bedz);
  const bedzByName = new Map(bedzRows.map((b) => [b.naziv, b.bedzId]));

  const existing = await db
    .select({ bedzId: schema.ucenikBedz.bedzId })
    .from(schema.ucenikBedz)
    .where(eq(schema.ucenikBedz.ucenikId, auth.korisnikId));
  const existingIds = new Set(existing.map((e) => e.bedzId));

  const now = new Date();
  const toAssign: Array<{ bedzId: number }> = [];

  for (const rule of BADGE_RULES) {
    const bedzId = bedzByName.get(rule.naziv);
    if (!bedzId || existingIds.has(bedzId)) continue;

    if (rule.minOdrzani && (stats?.odrzane ?? 0) >= rule.minOdrzani) {
      toAssign.push({ bedzId });
      continue;
    }
    if (rule.minRezervacije && (allReservations?.ukupno ?? 0) >= rule.minRezervacije) {
      toAssign.push({ bedzId });
      continue;
    }
    if (rule.minPetice && (fiveStar?.petice ?? 0) >= rule.minPetice) {
      toAssign.push({ bedzId });
    }
  }

  if (toAssign.length > 0) {
    await db.insert(schema.ucenikBedz).values(
      toAssign.map((b) => ({
        ucenikId: auth.korisnikId,
        bedzId: b.bedzId,
        datumDodele: now,
      }))
    );
  }

  const bedzevi = await db
    .select({
      bedzId: schema.bedz.bedzId,
      naziv: schema.bedz.naziv,
      opis: schema.bedz.opis,
      datumDodele: schema.ucenikBedz.datumDodele,
    })
    .from(schema.ucenikBedz)
    .innerJoin(schema.bedz, eq(schema.bedz.bedzId, schema.ucenikBedz.bedzId))
    .where(eq(schema.ucenikBedz.ucenikId, auth.korisnikId));

  return NextResponse.json({ bedzevi }, { status: 200 });
}
