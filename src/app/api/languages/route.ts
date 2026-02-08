import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getAuthPayload } from "@/lib/auth-server";

type CreateBody = { naziv: string };

//vraca listu svih jezika iz baze, sortirano po nazivu
export async function GET() {
  const rows = await db.query.jezik.findMany({
    columns: { jezikId: true, naziv: true },
    orderBy: (t, { asc }) => [asc(t.naziv)],
  });
  return NextResponse.json({ languages: rows }, { status: 200 });
}

