import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = Partial<{
  biografija: string | null;
  cenaPoCasu: string;
  verifikovan: boolean;
  languages: Array<{ jezikId: number; nivo: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" }>;
}>;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
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
  if (!tutor) {
    return NextResponse.json({ tutor: null, languages: [] }, { status: 200 });
  }

  const languages = await db
    .select({
      jezikId: schema.jezik.jezikId,
      naziv: schema.jezik.naziv,
      nivo: schema.tutorJezik.nivo,
    })
    .from(schema.tutorJezik)
    .innerJoin(schema.jezik, eq(schema.jezik.jezikId, schema.tutorJezik.jezikId))
    .where(eq(schema.tutorJezik.tutorId, id));

  return NextResponse.json({ tutor, languages }, { status: 200 });
}

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

  if (Array.isArray(body.languages)) {
    await db.delete(schema.tutorJezik).where(eq(schema.tutorJezik.tutorId, id));
    if (body.languages.length > 0) {
      await db.insert(schema.tutorJezik).values(
        body.languages.map((l) => ({
          tutorId: id,
          jezikId: l.jezikId,
          nivo: l.nivo,
        }))
      );
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

  if (auth.role !== "ADMIN" && auth.korisnikId !== id) {
    return NextResponse.json({ error: "Nemate pravo da obrišete profil." }, { status: 403 });
  }

  await db.delete(schema.tutor).where(eq(schema.tutor.korisnikId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
