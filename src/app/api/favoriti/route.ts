import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = {
  tutorId: number;
};

type DeleteBody = {
  tutorId: number;
};

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "UCENIK") {
    return NextResponse.json({ favoriti: [] }, { status: 200 });
  }

  const favoriti = await db
    .select({
      tutorId: schema.favorit.tutorId,
      datumDodavanja: schema.favorit.datumDodavanja,
    })
    .from(schema.favorit)
    .where(eq(schema.favorit.ucenikId, auth.korisnikId));

  return NextResponse.json({ favoriti }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "UCENIK") {
    return NextResponse.json({ error: "Nemate pravo da dodajete favorite." }, { status: 403 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body?.tutorId) {
    return NextResponse.json({ error: "Tutor ID je obavezan." }, { status: 400 });
  }

  const existing = await db.query.favorit.findFirst({
    where: and(
      eq(schema.favorit.ucenikId, auth.korisnikId),
      eq(schema.favorit.tutorId, body.tutorId)
    ),
    columns: { tutorId: true },
  });

  if (existing) {
    return NextResponse.json({ ok: true, already: true }, { status: 200 });
  }

  await db.insert(schema.favorit).values({
    ucenikId: auth.korisnikId,
    tutorId: body.tutorId,
    datumDodavanja: new Date(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "UCENIK") {
    return NextResponse.json({ error: "Nemate pravo da uklonite favorite." }, { status: 403 });
  }

  const body = (await req.json()) as DeleteBody;
  if (!body?.tutorId) {
    return NextResponse.json({ error: "Tutor ID je obavezan." }, { status: 400 });
  }

  await db
    .delete(schema.favorit)
    .where(
      and(
        eq(schema.favorit.ucenikId, auth.korisnikId),
        eq(schema.favorit.tutorId, body.tutorId)
      )
    );

  return NextResponse.json({ ok: true }, { status: 200 });
}
