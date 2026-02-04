import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = { naziv: string };

export async function GET() {
  const rows = await db.query.jezik.findMany({
    columns: { jezikId: true, naziv: true },
    orderBy: (t, { asc }) => [asc(t.naziv)],
  });

  return NextResponse.json({ languages: rows }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo da dodate jezik." }, { status: 403 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body?.naziv?.trim()) {
    return NextResponse.json({ error: "Naziv jezika je obavezan." }, { status: 400 });
  }

  await db.insert(schema.jezik).values({ naziv: body.naziv.trim() });

  return NextResponse.json({ ok: true }, { status: 201 });
}
