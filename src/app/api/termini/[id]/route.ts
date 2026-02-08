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


// omoguci tutorima da brisu svoje termine, 
// ali samo ako su slobodni
// inace mora da se otkazu rezervacija, pa da se termin obrise
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "TUTOR" ) {
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
