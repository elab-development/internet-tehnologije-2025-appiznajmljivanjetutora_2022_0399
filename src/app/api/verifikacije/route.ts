import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = {
  dokumentUrl: string;
};

export async function GET(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ zahtevi: [] }, { status: 200 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const allowed = new Set(["NOV", "ODOBREN", "ODBIJEN"]);
  const statusFilter = status && allowed.has(status) ? status : null;

  const where = statusFilter
    ? eq(schema.zahtevVerifikacije.status, statusFilter as "NOV" | "ODOBREN" | "ODBIJEN")
    : undefined;

  const zahtevi = await db
    .select({
      zahtevId: schema.zahtevVerifikacije.zahtevId,
      tutorId: schema.zahtevVerifikacije.tutorId,
      adminId: schema.zahtevVerifikacije.adminId,
      status: schema.zahtevVerifikacije.status,
      datumPodnosenja: schema.zahtevVerifikacije.datumPodnosenja,
      datumOdluke: schema.zahtevVerifikacije.datumOdluke,
      dokumentUrl: schema.zahtevVerifikacije.dokumentUrl,
      tutorIme: schema.korisnik.ime,
      tutorPrezime: schema.korisnik.prezime,
    })
    .from(schema.zahtevVerifikacije)
    .innerJoin(schema.korisnik, eq(schema.korisnik.korisnikId, schema.zahtevVerifikacije.tutorId))
    .where(where);

  return NextResponse.json({ zahtevi }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "TUTOR") {
    return NextResponse.json({ error: "Nemate pravo da podnesete zahtev." }, { status: 403 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body?.dokumentUrl) {
    return NextResponse.json({ error: "Dokument URL je obavezan." }, { status: 400 });
  }

  await db.insert(schema.zahtevVerifikacije).values({
    tutorId: auth.korisnikId,
    status: "NOV",
    datumPodnosenja: new Date(),
    dokumentUrl: body.dokumentUrl,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
