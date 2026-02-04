import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  const rows = await db.query.jezik.findMany({
    columns: { jezikId: true, naziv: true },
    orderBy: (t, { asc }) => [asc(t.naziv)],
  });

  return NextResponse.json({ languages: rows }, { status: 200 });
}
