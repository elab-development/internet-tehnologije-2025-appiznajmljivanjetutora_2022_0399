import { NextResponse } from "next/server";
import { db } from "@/db";
import { zahtevVerifikacije } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "TUTOR") {
    return NextResponse.json({ zahtevi: [] }, { status: 200 });
  }

  const zahtevi = await db
    .select({
      zahtevId: zahtevVerifikacije.zahtevId,
      status: zahtevVerifikacije.status,
      datumPodnosenja: zahtevVerifikacije.datumPodnosenja,
      datumOdluke: zahtevVerifikacije.datumOdluke,
      dokumentUrl: zahtevVerifikacije.dokumentUrl,
    })
    .from(zahtevVerifikacije)
    .where(eq(zahtevVerifikacije.tutorId, auth.korisnikId))
    .orderBy(desc(zahtevVerifikacije.datumPodnosenja));

  return NextResponse.json({ zahtevi }, { status: 200 });
}
