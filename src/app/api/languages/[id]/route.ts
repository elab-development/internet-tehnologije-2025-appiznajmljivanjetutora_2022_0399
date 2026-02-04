import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = { naziv?: string };

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da menjate jezik." }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  const body = (await req.json()) as UpdateBody;
  if (!body?.naziv?.trim()) {
    return NextResponse.json({ error: "Naziv jezika je obavezan." }, { status: 400 });
  }

  await db.update(schema.jezik).set({ naziv: body.naziv.trim() }).where(eq(schema.jezik.jezikId, id));

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
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da obrišete jezik." }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  await db.delete(schema.jezik).where(eq(schema.jezik.jezikId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
