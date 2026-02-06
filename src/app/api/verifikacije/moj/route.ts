import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "TUTOR") {
    return NextResponse.json({ zahtev: null }, { status: 200 });
  }

  const zahtev = await db
    .select({
      zahtevId: schema.zahtevVerifikacije.zahtevId,
      tutorId: schema.zahtevVerifikacije.tutorId,
      adminId: schema.zahtevVerifikacije.adminId,
      status: schema.zahtevVerifikacije.status,
      datumPodnosenja: schema.zahtevVerifikacije.datumPodnosenja,
      datumOdluke: schema.zahtevVerifikacije.datumOdluke,
      dokumentUrl: schema.zahtevVerifikacije.dokumentUrl,
    })
    .from(schema.zahtevVerifikacije)
    .where(eq(schema.zahtevVerifikacije.tutorId, auth.korisnikId))
    .orderBy(desc(schema.zahtevVerifikacije.datumPodnosenja))
    .limit(1);

  return NextResponse.json({ zahtev: zahtev[0] ?? null }, { status: 200 });
}
