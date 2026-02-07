import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type UpdateBody = Partial<{
  status: "AKTIVNA" | "OTKAZANA" | "ODRZANA";
}>;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  const body = (await req.json()) as UpdateBody;
  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Nema podataka za izmenu." }, { status: 400 });
  }

  if (body.status === "OTKAZANA") {
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
  }

  await db
    .update(schema.rezervacija)
    .set(body)
    .where(eq(schema.rezervacija.rezervacijaId, id));

  if (body.status === "OTKAZANA") {
    const rez = await db.query.rezervacija.findFirst({
      where: eq(schema.rezervacija.rezervacijaId, id),
      columns: { terminId: true },
    });
    if (rez?.terminId) {
      await db
        .update(schema.termin)
        .set({ status: "OTKAZAN" })
        .where(eq(schema.termin.terminId, rez.terminId));
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) {
    return NextResponse.json({ error: "Neispravan ID." }, { status: 400 });
  }

  await db
    .delete(schema.rezervacija)
    .where(eq(schema.rezervacija.rezervacijaId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
