import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

//poslovna logika za dodelu bedzeva učenicima na osnovu njihovih aktivnosti 
//(broj održanih časova, broj rezervacija, broj petica u recenzijama)
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
  //ako nije prijavljen ili nije validan token, vraćamo prazan niz bedzeva
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
}
  // ako nije učenik, vraćamo prazan niz bedzeva (bedzeve dodeljujemo samo učenicima)
  if (auth.role !== "UCENIK") {
    return NextResponse.json({ bedzevi: [] }, { status: 200 });
  }

  // automatska dodela bedzeva na osnovu aktivnosti
  //vraca stats {odrzane: broj održanih časova}, allReservations {ukupno: broj rezervacija}, fiveStar {petice: broj petica u recenzijama}
  const [stats] = await db.select({
      odrzane: sql<number>`count(*)`,
    })
    .from(schema.rezervacija)
    .where(and(
        eq(schema.rezervacija.ucenikId, auth.korisnikId),
        eq(schema.rezervacija.status, "ODRZANA")
      )
    );

  const [allReservations] = await db.select({
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

  //vraca sve bedzeve koje učenik već ima 
  //da ne bi dodelili isti bedz više puta
  const existing = await db
    .select({ bedzId: schema.ucenikBedz.bedzId })
    .from(schema.ucenikBedz)
    .where(eq(schema.ucenikBedz.ucenikId, auth.korisnikId));
  
    //pravimo set postojećih bedzeva da bi brzo proveravali 
  //da li učenik već ima određeni bedz
  const existingIds = new Set(existing.map((e) => e.bedzId));

  const now = new Date();

  //prolazimo kroz pravila za bedzeve i proveravamo da li učenik ispunjava uslove za 
  //dodelu svakog bedza
  //ako ispunjava, i ako već nema taj bedz, dodajemo ga u listu za dodelu (toAssign)
  const toAssign: Array<{ bedzId: number }> = [];

  for (const rule of BADGE_RULES) {
    const bedzId = bedzByName.get(rule.naziv);
    //ako bedz ne postoji u bazi ili ako učenik već ima taj bedz, preskacemo
    if (!bedzId || existingIds.has(bedzId)) continue;
    //ako u konkretnom pravilu postoji uslov minOdrzani 
    //i učenik ima dovoljno održanih časova, dodeljujemo bedz
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
  //unesi nove bedzeve koje treba dodeliti učeniku u tabelu ucenikBedz
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
  //vraćamo sve bedzeve koje učenik ima 
  //nakon eventualne dodele novih bedzeva 
    return NextResponse.json({ bedzevi }, { status: 200 });
}
