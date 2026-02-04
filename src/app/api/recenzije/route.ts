import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = {
  rezervacijaId: number;
  ocena: number;
  komentar?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rezervacijaId = searchParams.get("rezervacijaId");

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

  await db.insert(schema.recenzija).values({
    rezervacijaId: body.rezervacijaId,
    ocena: body.ocena,
    komentar: body.komentar ?? null,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
