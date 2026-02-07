import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = {
  tutorId?: number;
  datum: string;
  vremeOd: string;
  vremeDo: string;
  status?: "SLOBODAN" | "REZERVISAN" | "OTKAZAN";
};

export async function GET(req: Request) {
  await db.execute(sql`
    UPDATE termin t
    JOIN rezervacija r ON r.termin_id = t.termin_id
    SET t.status_termina = 'REZERVISAN'
    WHERE t.status_termina = 'SLOBODAN'
  `);

  const { searchParams } = new URL(req.url);
  const tutorId = searchParams.get("tutorId");
  const datum = searchParams.get("datum");
  const statusParam = searchParams.get("status");
  const statuses = new Set(["SLOBODAN", "REZERVISAN", "OTKAZAN"]);
  const status = statusParam && statuses.has(statusParam) ? statusParam : null;

  const parsedDatum =
    datum && !Number.isNaN(new Date(datum).getTime()) ? new Date(datum) : null;

  const where = and(
    tutorId ? eq(schema.termin.tutorId, Number(tutorId)) : undefined,
    parsedDatum ? eq(schema.termin.datum, parsedDatum) : undefined,
    status ? eq(schema.termin.status, status as "SLOBODAN" | "REZERVISAN" | "OTKAZAN") : undefined
  );

  const baseSelect = {
    terminId: schema.termin.terminId,
    tutorId: schema.termin.tutorId,
    datum: schema.termin.datum,
    vremeOd: schema.termin.vremeOd,
    vremeDo: schema.termin.vremeDo,
    status: schema.termin.status,
  };

  const termini =
    status === "SLOBODAN"
      ? await db
          .select(baseSelect)
          .from(schema.termin)
          .leftJoin(schema.rezervacija, eq(schema.rezervacija.terminId, schema.termin.terminId))
          .where(and(where, isNull(schema.rezervacija.rezervacijaId)))
      : await db.select(baseSelect).from(schema.termin).where(where);

  return NextResponse.json({ termini }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "TUTOR" && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da kreirate termin." }, { status: 403 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body?.datum || !body?.vremeOd || !body?.vremeDo) {
    return NextResponse.json({ error: "Datum i vreme su obavezni." }, { status: 400 });
  }

  const tutorId = auth.role === "TUTOR" ? auth.korisnikId : body.tutorId;
  if (!tutorId) {
    return NextResponse.json({ error: "Tutor ID je obavezan." }, { status: 400 });
  }

  const datumValue = new Date(body.datum);
  if (Number.isNaN(datumValue.getTime())) {
    return NextResponse.json({ error: "Neispravan datum." }, { status: 400 });
  }

  await db.insert(schema.termin).values({
    tutorId,
    datum: datumValue,
    vremeOd: body.vremeOd,
    vremeDo: body.vremeDo,
    status: body.status ?? "SLOBODAN",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
