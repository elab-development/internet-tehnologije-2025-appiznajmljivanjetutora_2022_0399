import { db, schema } from "@/src/db";
import { eq } from "drizzle-orm";

export async function getRoleForUser(korisnikId: number) {
  const isAdmin = await db.query.administrator.findFirst({
    where: eq(schema.administrator.korisnikId, korisnikId),
    columns: { korisnikId: true },
  });
  if (isAdmin) return "ADMIN" as const;

  const isTutor = await db.query.tutor.findFirst({
    where: eq(schema.tutor.korisnikId, korisnikId),
    columns: { korisnikId: true },
  });
  if (isTutor) return "TUTOR" as const;

  const isUcenik = await db.query.ucenik.findFirst({
    where: eq(schema.ucenik.korisnikId, korisnikId),
    columns: { korisnikId: true },
  });
  if (isUcenik) return "UCENIK" as const;

  // fallback (ne bi trebalo da se desi)
  return "UCENIK" as const;
}
