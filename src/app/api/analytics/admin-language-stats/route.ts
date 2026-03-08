import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo pristupa." }, { status: 403 });
  }

  const rows = await db
    .select({
      language: schema.jezik.naziv,
      tutorCount: sql<number>`count(distinct ${schema.tutorJezik.tutorId})`,
      avgPriceRsd: sql<number>`round(avg(${schema.tutor.cenaPoCasu}), 2)`,
      verifiedCount: sql<number>`sum(case when ${schema.tutor.verifikovan} = true then 1 else 0 end)`,
    })
    .from(schema.tutorJezik)
    .innerJoin(schema.jezik, eq(schema.jezik.jezikId, schema.tutorJezik.jezikId))
    .innerJoin(schema.tutor, eq(schema.tutor.korisnikId, schema.tutorJezik.tutorId))
    .groupBy(schema.jezik.naziv);

  return NextResponse.json({ stats: rows }, { status: 200 });
}
