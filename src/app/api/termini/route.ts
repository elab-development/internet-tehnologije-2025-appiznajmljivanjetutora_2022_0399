import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = {
  tutorId?: number;
  datum: string;
  vremeOd: string;
  vremeDo: string;
  status?: "SLOBODAN" | "REZERVISAN" | "OTKAZAN";
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tutorId = searchParams.get("tutorId");
  const datum = searchParams.get("datum");

  const where = and(
    tutorId ? eq(schema.termin.tutorId, Number(tutorId)) : undefined,
    datum ? eq(schema.termin.datum, datum) : undefined
  );

  const termini = await db
    .select({
      terminId: schema.termin.terminId,
      tutorId: schema.termin.tutorId,
      datum: schema.termin.datum,
      vremeOd: schema.termin.vremeOd,
      vremeDo: schema.termin.vremeDo,
      status: schema.termin.status,
    })
    .from(schema.termin)
    .where(where);

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

  await db.insert(schema.termin).values({
    tutorId,
    datum: body.datum,
    vremeOd: body.vremeOd,
    vremeDo: body.vremeDo,
    status: body.status ?? "SLOBODAN",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
