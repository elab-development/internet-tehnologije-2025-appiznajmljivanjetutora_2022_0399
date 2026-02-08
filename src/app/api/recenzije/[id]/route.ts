import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = Partial<{
  ocena: number;
  komentar: string | null;
}>;
//admin moze da obrise recenziju
export async function DELETE( { params }: { params: { id: string } }) 
{
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da obrisete recenziju." }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }
  await db.delete(schema.recenzija).where(eq(schema.recenzija.recenzijaId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
