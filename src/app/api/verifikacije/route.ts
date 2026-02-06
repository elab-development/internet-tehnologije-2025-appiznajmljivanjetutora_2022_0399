import { NextResponse } from "next/server";
import { db } from "@/db";
import { zahtevVerifikacije, korisnik } from "@/db/schema";
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
    ? eq(zahtevVerifikacije.status, statusFilter as "NOV" | "ODOBREN" | "ODBIJEN")
    : undefined;

  const zahtevi = await db
    .select({
      zahtevId: zahtevVerifikacije.zahtevId,
      tutorId: zahtevVerifikacije.tutorId,
      adminId: zahtevVerifikacije.adminId,
      status: zahtevVerifikacije.status,
      datumPodnosenja: zahtevVerifikacije.datumPodnosenja,
      datumOdluke: zahtevVerifikacije.datumOdluke,
      dokumentUrl: zahtevVerifikacije.dokumentUrl,
      tutorIme: korisnik.ime,
      tutorPrezime: korisnik.prezime,
    })
    .from(zahtevVerifikacije)
    .innerJoin(korisnik, eq(korisnik.korisnikId, zahtevVerifikacije.tutorId))
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

  await db.insert(zahtevVerifikacije).values({
    tutorId: auth.korisnikId,
    status: "NOV",
    datumPodnosenja: new Date(),
    dokumentUrl: body.dokumentUrl,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
