import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "UCENIK") {
    return NextResponse.json({ bedzevi: [] }, { status: 200 });
  }

  const bedzevi = await db
    .select({
      bedzId: schema.bedz.bedzId,
      naziv: schema.bedz.naziv,
      opis: schema.bedz.opis,
      datumDodele: schema.ucenikBedz.datumDodele,
    })
    .from(schema.ucenikBedz)
    .innerJoin(schema.bedz, eq(schema.bedz.bedzId, schema.ucenikBedz.bedzId))
    .where(eq(schema.ucenikBedz.ucenikId, auth.korisnikId));

  return NextResponse.json({ bedzevi }, { status: 200 });
}
