import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = Partial<{
  ocena: number;
  komentar: string | null;
}>;

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  const body = (await req.json()) as UpdateBody;
  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Nema podataka za izmenu." }, { status: 400 });
  }

  await db
    .update(schema.recenzija)
    .set(body)
    .where(eq(schema.recenzija.recenzijaId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  await db.delete(schema.recenzija).where(eq(schema.recenzija.recenzijaId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
