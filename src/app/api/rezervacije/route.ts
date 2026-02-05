import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = {
  terminId: number;
  ucenikId?: number;
  status?: "AKTIVNA" | "OTKAZANA" | "ODRZANA";
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ucenikId = searchParams.get("ucenikId");
  const terminId = searchParams.get("terminId");
  const statusParam = searchParams.get("status");
  const statuses = new Set<Status>(["AKTIVNA", "OTKAZANA", "ODRZANA"]);
  const status = statusParam && statuses.has(statusParam as Status) ? (statusParam as Status) : null;

  const where = and(
    ucenikId ? eq(schema.rezervacija.ucenikId, Number(ucenikId)) : undefined,
    terminId ? eq(schema.rezervacija.terminId, Number(terminId)) : undefined,
    status ? eq(schema.rezervacija.status, status) : undefined
  );

  const rezervacije = await db
    .select({
      rezervacijaId: schema.rezervacija.rezervacijaId,
      terminId: schema.rezervacija.terminId,
      ucenikId: schema.rezervacija.ucenikId,
      status: schema.rezervacija.status,
    })
    .from(schema.rezervacija)
    .where(where);

  return NextResponse.json({ rezervacije }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "UCENIK" && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da kreirate rezervaciju." }, { status: 403 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body?.terminId) {
    return NextResponse.json({ error: "Termin ID je obavezan." }, { status: 400 });
  }

  const ucenikId = auth.role === "UCENIK" ? auth.korisnikId : body.ucenikId;
  if (!ucenikId) {
    return NextResponse.json({ error: "Ucenik ID je obavezan." }, { status: 400 });
  }

  const termin = await db.query.termin.findFirst({
    where: eq(schema.termin.terminId, body.terminId),
    columns: {
      terminId: true,
      status: true,
    },
  });
  if (!termin) {
    return NextResponse.json({ error: "Termin ne postoji." }, { status: 404 });
  }
  if (termin.status !== "SLOBODAN") {
    return NextResponse.json({ error: "Termin nije slobodan." }, { status: 409 });
  }

  await db.insert(schema.rezervacija).values({
    terminId: body.terminId,
    ucenikId,
    status: body.status ?? "AKTIVNA",
  });

  await db
    .update(schema.termin)
    .set({ status: "REZERVISAN" })
    .where(eq(schema.termin.terminId, body.terminId));

  return NextResponse.json({ ok: true }, { status: 201 });
}

type Status = "AKTIVNA" | "OTKAZANA" | "ODRZANA";
