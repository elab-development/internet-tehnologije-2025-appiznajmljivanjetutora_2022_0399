import { NextResponse } from "next/server";
import { db } from "@/db";
import { zahtevVerifikacije } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

//vrati poslednji zahtev za verifikaciju koji je podneo tutor
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
      zahtevId: zahtevVerifikacije.zahtevId,
      tutorId: zahtevVerifikacije.tutorId,
      adminId: zahtevVerifikacije.adminId,
      status: zahtevVerifikacije.status,
      datumPodnosenja: zahtevVerifikacije.datumPodnosenja,
      datumOdluke: zahtevVerifikacije.datumOdluke,
      dokumentUrl: zahtevVerifikacije.dokumentUrl,
    })
    .from(zahtevVerifikacije)
    .where(eq(zahtevVerifikacije.tutorId, auth.korisnikId))
    .orderBy(desc(zahtevVerifikacije.datumPodnosenja))
    .limit(1);

  return NextResponse.json({ zahtev: zahtev[0] ?? null }, { status: 200 });
}
