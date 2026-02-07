import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = Partial<{
  datum: string;
  vremeOd: string;
  vremeDo: string;
  status: "SLOBODAN" | "REZERVISAN" | "OTKAZAN";
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

  const termin = await db.query.termin.findFirst({
    where: eq(schema.termin.terminId, id),
    columns: {
      terminId: true,
      tutorId: true,
      datum: true,
      vremeOd: true,
      vremeDo: true,
      status: true,
    },
  });

  return NextResponse.json({ termin: termin ?? null }, { status: 200 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "TUTOR" && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da menjate termin." }, { status: 403 });
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

  const updateData = {
    datum: body.datum ? new Date(body.datum) : undefined,
    vremeOd: body.vremeOd,
    vremeDo: body.vremeDo,
    status: body.status,
  } as {
    datum?: Date;
    vremeOd?: string;
    vremeDo?: string;
    status?: "SLOBODAN" | "REZERVISAN" | "OTKAZAN";
  };
  if (updateData.datum && Number.isNaN(updateData.datum.getTime())) {
    return NextResponse.json({ error: "Neispravan datum." }, { status: 400 });
  }

  await db.update(schema.termin).set(updateData).where(eq(schema.termin.terminId, id));

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
  if (auth.role !== "TUTOR" && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da brisete termin." }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  const termin = await db.query.termin.findFirst({
    where: eq(schema.termin.terminId, id),
    columns: { status: true, tutorId: true },
  });
  if (!termin) {
    return NextResponse.json({ error: "Termin ne postoji." }, { status: 404 });
  }

  if (auth.role === "TUTOR" && termin.tutorId !== auth.korisnikId) {
    return NextResponse.json({ error: "Nemate pravo da brisete ovaj termin." }, { status: 403 });
  }

  if (termin.status !== "SLOBODAN") {
    return NextResponse.json(
      { error: "Termin moze da se obrise samo ako je slobodan." },
      { status: 409 }
    );
  }

  await db.delete(schema.termin).where(eq(schema.termin.terminId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
