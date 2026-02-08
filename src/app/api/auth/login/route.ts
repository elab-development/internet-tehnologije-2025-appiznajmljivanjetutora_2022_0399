// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { getRoleForUser } from "@/lib/role";

type Body = { email: string; lozinka: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body; 
  //ako telo requesta ne sadrži email ili lozinku, vraćamo grešku 400 (Bad Request) sa porukom da su email i lozinka obavezni
  if (!body?.email || !body?.lozinka) {
    return NextResponse.json({ error: "Email i lozinka su obavezni." }, { status: 400 });
  }
  //ako nema korisnika sa datim emailom, vraćamo grešku 401 (Unauthorized) 
  const user = await db.query.korisnik.findFirst({
    where: eq(schema.korisnik.email, body.email),
  });
  //ako korisnik postoji, ali nije aktivan, vraćamo grešku 403 (Forbidden) 
  if (!user) {
    return NextResponse.json({ error: "Pogrešan email ili lozinka." }, { status: 401 });
  }
  //ako korisnik postoji, ali nije aktivan, vraćamo grešku 403 (Forbidden)
  if (user.statusNaloga !== "AKTIVAN") {
    return NextResponse.json({ error: "Nalog je blokiran." }, { status: 403 });
  }
  //poredjene lozinke iz baze (hashovane) i lozinke iz requesta (plain text)
  //koristeći bcrypt.compare.
  //ako se lozinke ne poklapaju, vraćamo grešku 401 (Unauthorized) 
  const ok = await bcrypt.compare(body.lozinka, user.lozinka);
  if (!ok) {
    return NextResponse.json({ error: "Pogrešan email ili lozinka." }, { status: 401 });
  }


  const role = await getRoleForUser(user.korisnikId);
  const token = await signToken({ korisnikId: user.korisnikId, role });
//ako su email i lozinka ispravni, kreiramo JWT token koji sadrži 
// korisnikId i role, i vraćamo odgovor 200 (OK) 
// sa podacima o korisniku (korisnikId, role, email, ime, prezime)
  const res = NextResponse.json(
    { korisnikId: user.korisnikId, role, email: user.email, ime: user.ime, prezime: user.prezime },
    { status: 200 }
  );
  //postavljamo cookie sa tokenom koji je 
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,  // httpOnly (nije dostupan JS-u na clientu),
    sameSite: "lax",  // sameSite "lax" (ne šalje se na cross-site requestima osim GET), 
    secure: false,  // secure false (dozvoljeno i na http, ne samo https, u produkciji bi trebalo true), 
    path: "/",  // path "/" (dostupno na svim rutama), 
    maxAge: 60 * 60 * 24 * 7,  // maxAge 7 dana (vremenski period nakon kojeg cookie ističe)
  });

  return res; // vraćamo odgovor sa postavljenim cookie-jem
}
