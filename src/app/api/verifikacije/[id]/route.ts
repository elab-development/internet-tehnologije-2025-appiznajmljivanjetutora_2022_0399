import { NextResponse } from "next/server";
import { db } from "@/db";
import { tutor, zahtevVerifikacije } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = {
  status: "ODOBREN" | "ODBIJEN";
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da obradite zahtev." }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  const body = (await req.json()) as UpdateBody;
  if (!body?.status || (body.status !== "ODOBREN" && body.status !== "ODBIJEN")) {
    return NextResponse.json({ error: "Status nije ispravan." }, { status: 400 });
  }

  const existing = await db.query.zahtevVerifikacije.findFirst({
    where: eq(zahtevVerifikacije.zahtevId, id),
    columns: { status: true, tutorId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Zahtev nije pronađen." }, { status: 404 });
  }
  if (existing.status !== "NOV") {
    return NextResponse.json(
      { error: "Zahtev je već obrađen." },
      { status: 409 }
    );
  }

  await db
    .update(zahtevVerifikacije)
    .set({
      status: body.status,
      adminId: auth.korisnikId,
      datumOdluke: new Date(),
    })
    .where(eq(zahtevVerifikacije.zahtevId, id));

  if (body.status === "ODOBREN") {
    if (existing.tutorId) {
      await db
        .update(tutor)
        .set({ verifikovan: true })
        .where(eq(tutor.korisnikId, existing.tutorId));
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
