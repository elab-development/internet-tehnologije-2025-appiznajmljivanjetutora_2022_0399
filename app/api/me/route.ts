// app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyToken } from "@/src/lib/auth";
import { db, schema } from "@/src/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const payload = await verifyToken(token);

    const user = await db.query.korisnik.findFirst({
      where: eq(schema.korisnik.korisnikId, payload.korisnikId),
      columns: {
        korisnikId: true,
        ime: true,
        prezime: true,
        email: true,
        statusNaloga: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      { user: { ...user, role: payload.role } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
