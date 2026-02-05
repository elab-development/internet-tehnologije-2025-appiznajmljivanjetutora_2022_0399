import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = Partial<{
  status: "AKTIVNA" | "OTKAZANA" | "ODRZANA";
}>;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  const body = (await req.json()) as UpdateBody;
  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Nema podataka za izmenu." }, { status: 400 });
  }

  await db
    .update(schema.rezervacija)
    .set(body)
    .where(eq(schema.rezervacija.rezervacijaId, id));

  if (body.status === "OTKAZANA") {
    const rez = await db.query.rezervacija.findFirst({
      where: eq(schema.rezervacija.rezervacijaId, id),
      columns: { terminId: true },
    });
    if (rez?.terminId) {
      await db
        .update(schema.termin)
        .set({ status: "SLOBODAN" })
        .where(eq(schema.termin.terminId, rez.terminId));
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  await db
    .delete(schema.rezervacija)
    .where(eq(schema.rezervacija.rezervacijaId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
