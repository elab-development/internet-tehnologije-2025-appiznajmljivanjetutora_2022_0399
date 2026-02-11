import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = {
  status: "OTKAZANA";
};
//otkazivanje rezervacije je moguce samo ako je trenutni status "AKTIVNA"
//ili ako je do pocetka termina ostalo vise od 24h
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  //vrati id rezervacije iz parametara i podatke za update iz tela zahteva
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }
  const body = (await req.json()) as UpdateBody;
  if (!body?.status || body.status !== "OTKAZANA") {
    return NextResponse.json({ error: "Status mora biti OTKAZANA." }, { status: 400 });
  }

  //proveri da li rezervacija postoji i da li je vec zavrsena ili otkazana
  //ako je rezervacija vec zavrsena ili otkazana, nije moguce je ponovo otkazati
    const rez = await db
      .select({
        rezervacijaId: schema.rezervacija.rezervacijaId,
        status: schema.rezervacija.status,
        ucenikId: schema.rezervacija.ucenikId,
        terminId: schema.rezervacija.terminId,
        datum: schema.termin.datum,
        vremeOd: schema.termin.vremeOd,
        tutorId: schema.termin.tutorId,
      })
      .from(schema.rezervacija)
      .innerJoin(schema.termin, eq(schema.termin.terminId, schema.rezervacija.terminId))
      .where(eq(schema.rezervacija.rezervacijaId, id));
    const current = rez[0];
    if (!current) {
      return NextResponse.json({ error: "Rezervacija ne postoji." }, { status: 404 });
    }

    if (current.status === "ODRZANA" || current.status === "OTKAZANA") {
      return NextResponse.json(
        { error: "Rezervacija je vec zavrsena ili otkazana." },
        { status: 409 }
      );
    }

    if (auth.role === "UCENIK" && current.ucenikId !== auth.korisnikId) {
      return NextResponse.json({ error: "Nemate pravo da otkazete ovu rezervaciju." }, { status: 403 });
    }

    if (auth.role === "TUTOR" && current.tutorId !== auth.korisnikId) {
      return NextResponse.json({ error: "Nemate pravo da otkazete ovu rezervaciju." }, { status: 403 });
    }

    //proveri da li je otkazivanje moguce (nije moguce ako je manje od 24h do pocetka termina)
    const toDatePart = (value: unknown) => {
      if (value instanceof Date) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
          value.getDate()
        ).padStart(2, "0")}`;
      }
      return String(value).split("T")[0];
    };
    const toTimePart = (value: unknown) => {
      if (value instanceof Date) {
        return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(
          2,
          "0"
        )}:${String(value.getSeconds()).padStart(2, "0")}`;
      }
      const raw = String(value);
      if (raw.includes("T")) {
        const parts = raw.split("T")[1];
        return parts?.split(".")[0] ?? raw;
      }
      return raw;
    };
    const datePart = toDatePart(current.datum);
    const timePart = toTimePart(current.vremeOd);
    const startDateTime = new Date(`${datePart}T${timePart}`);
    const diffMs = startDateTime.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (!Number.isNaN(diffHours) && diffHours < 24) {
      return NextResponse.json(
        { error: "Otkazivanje nije moguce manje od 24h pre pocetka termina." },
        { status: 409 }
      );
    }
  //azuriraj rezervaciju na "OTKAZANA",
  //i status termina na "SLOBODAN"
  await db
    .update(schema.rezervacija)
    .set({ status: "OTKAZANA" })
    .where(eq(schema.rezervacija.rezervacijaId, id));

    await db
      .update(schema.termin)
      .set({ status: "SLOBODAN" })
      .where(eq(schema.termin.terminId, current.terminId));

  return NextResponse.json({ ok: true }, { status: 200 });
}
