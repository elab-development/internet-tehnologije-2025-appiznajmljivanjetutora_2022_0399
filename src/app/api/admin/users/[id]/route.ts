import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = {
  statusNaloga: "AKTIVAN" | "BLOKIRAN";
};

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo." }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  const body = (await req.json()) as UpdateBody;
  if (!body?.statusNaloga) {
    return NextResponse.json({ error: "Status je obavezan." }, { status: 400 });
  }

  await db
    .update(schema.korisnik)
    .set({ statusNaloga: body.statusNaloga })
    .where(eq(schema.korisnik.korisnikId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
