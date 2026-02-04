import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = Partial<{
  biografija: string | null;
  cenaPoCasu: string;
  verifikovan: boolean;
}>;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  const rows = await db
    .select({
      tutorId: schema.tutor.korisnikId,
      ime: schema.korisnik.ime,
      prezime: schema.korisnik.prezime,
      cenaPoCasu: schema.tutor.cenaPoCasu,
      verifikovan: schema.tutor.verifikovan,
      prosecnaOcena: schema.tutor.prosecnaOcena,
      biografija: schema.tutor.biografija,
    })
    .from(schema.tutor)
    .innerJoin(schema.korisnik, eq(schema.korisnik.korisnikId, schema.tutor.korisnikId))
    .where(eq(schema.tutor.korisnikId, id));

  const tutor = rows[0] ?? null;
  return NextResponse.json({ tutor }, { status: 200 });
}

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

  if (auth.role !== "ADMIN" && auth.korisnikId !== id) {
    return NextResponse.json({ error: "Nemate pravo da menjate profil." }, { status: 403 });
  }

  const body = (await req.json()) as UpdateBody;
  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Nema podataka za izmenu." }, { status: 400 });
  }

  const updateData: UpdateBody = {
    biografija: body.biografija,
    cenaPoCasu: body.cenaPoCasu,
  };

  if (auth.role === "ADMIN") {
    updateData.verifikovan = body.verifikovan;
  }

  await db.update(schema.tutor).set(updateData).where(eq(schema.tutor.korisnikId, id));

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

  if (auth.role !== "ADMIN" && auth.korisnikId !== id) {
    return NextResponse.json({ error: "Nemate pravo da obrišete profil." }, { status: 403 });
  }

  await db.delete(schema.tutor).where(eq(schema.tutor.korisnikId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
