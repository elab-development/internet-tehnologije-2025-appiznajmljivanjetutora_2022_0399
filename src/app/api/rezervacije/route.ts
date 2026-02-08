import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = {
  terminId: number;
  ucenikId?: number;
  status?: "AKTIVNA" | "OTKAZANA" | "ODRZANA";
};
type Status = "AKTIVNA" | "OTKAZANA" | "ODRZANA";


export async function GET(req: Request) {
  //osvezi status rezervacija koje su aktivne, ali im je termin prosao na "odrzana"
  // Ovo je potrebno jer se status rezervacije ne menja automatski kada prođe termin, 
  // pa se na ovaj način osiguravamo da su podaci konzistentni.
  await db.execute(sql`
    UPDATE rezervacija r
    JOIN termin t ON r.termin_id = t.termin_id
    SET r.status_rezervacije = 'ODRZANA'
    WHERE r.status_rezervacije = 'AKTIVNA'
      AND TIMESTAMP(t.datum, t.vreme_do) < NOW()
  `);

  //vrati sve rezervacije koje odgovaraju prosledjenim 
  //parametrima (ucenikId, terminId, status)
  const { searchParams } = new URL(req.url);
  const ucenikId = searchParams.get("ucenikId");
  const terminId = searchParams.get("terminId");
  const statusParam = searchParams.get("status");
  const statuses = new Set<Status>(["AKTIVNA", "OTKAZANA", "ODRZANA"]);
  const status = statusParam && statuses.has(statusParam as Status) ? (statusParam as Status) : null;

  const where = and(
    ucenikId ? eq(schema.rezervacija.ucenikId, Number(ucenikId)) : undefined,
    terminId ? eq(schema.rezervacija.terminId, Number(terminId)) : undefined,
    status ? eq(schema.rezervacija.status, status) : undefined
  );

  const rezervacije = await db
    .select({
      rezervacijaId: schema.rezervacija.rezervacijaId,
      terminId: schema.rezervacija.terminId,
      ucenikId: schema.rezervacija.ucenikId,
      ucenikIme: schema.korisnik.ime,
      ucenikPrezime: schema.korisnik.prezime,
      status: schema.rezervacija.status,
    })
    .from(schema.rezervacija)
    .innerJoin(schema.korisnik, eq(schema.korisnik.korisnikId, schema.rezervacija.ucenikId))
    .where(where);

  return NextResponse.json({ rezervacije }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "UCENIK" ) {
    return NextResponse.json({ error: "Nemate pravo da kreirate rezervaciju." }, { status: 403 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body?.terminId) {
    return NextResponse.json({ error: "Termin ID je obavezan." }, { status: 400 });
  }

  const ucenikId = auth.role === "UCENIK" ? auth.korisnikId : body.ucenikId;
  if (!ucenikId) {
    return NextResponse.json({ error: "Ucenik ID je obavezan." }, { status: 400 });
  }
  //transakcija koja osigurava da se rezervacija kreira samo ako je termin slobodan, 
  //i da se status termina azurira na "REZERVISAN"
  try {
    await db.transaction(async (tx) => {
      //zakljucaj termin za update kako bi izbegli race-condtions
      const termin = await tx
        .select({
          terminId: schema.termin.terminId,
          status: schema.termin.status,
        })
        .from(schema.termin)
        .where(eq(schema.termin.terminId, body.terminId))
        .for("update");

      if (termin.length === 0) {
        throw { status: 404, message: "Termin ne postoji." };
      }
      //dozvoli ponovnu rezervaciju ako je prethodna otkazana
      if (termin[0].status !== "SLOBODAN" && termin[0].status !== "OTKAZAN") {
        throw { status: 409, message: "Termin nije slobodan." };
      }
      //zakljucaj rezervacije za update 
      const existing = await tx
        .select({
          rezervacijaId: schema.rezervacija.rezervacijaId,
          status: schema.rezervacija.status,
        })
        .from(schema.rezervacija)
        .where(eq(schema.rezervacija.terminId, body.terminId))
        .for("update");
      if (existing.length > 0) {
        if (existing[0].status === "OTKAZANA") {
          //ako je rezervacija otkazana, azuriraj je umesto da kreiras novu
          await tx
            .update(schema.rezervacija)
            .set({
              ucenikId,
              status: body.status ?? "AKTIVNA",
            })
            .where(eq(schema.rezervacija.rezervacijaId, existing[0].rezervacijaId));
          //azuriraj status termina na "REZERVISAN"
          await tx
            .update(schema.termin)
            .set({ status: "REZERVISAN" })
            .where(eq(schema.termin.terminId, body.terminId));

          return;
        }
        throw { status: 409, message: "Termin je vec rezervisan." };
      }
      //ako ne postoji rezervacija, kreiraj novu
      await tx.insert(schema.rezervacija).values({
        terminId: body.terminId,
        ucenikId,
        status: body.status ?? "AKTIVNA",
      });
      //azuriraj status termina na "REZERVISAN"
      await tx
        .update(schema.termin)
        .set({ status: "REZERVISAN" })
        .where(eq(schema.termin.terminId, body.terminId));
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && "message" in err) {
      const e = err as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json({ error: "Termin je vec rezervisan." }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

