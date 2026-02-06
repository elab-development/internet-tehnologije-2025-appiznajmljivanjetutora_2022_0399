// SEED: punimo bazu test podacima (prvo pokrenuti migracije!)

import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, schema } from "@/db";

async function main() {
  console.log("Seed start...");

  // 1) Jezici primer
  const languages = ["Engleski", "Nemački", "Francuski", "Španski", "Italijanski", "Ruski"];

  // ubaci jezike samo ako ih nema
  const existingLang = await db.query.jezik.findMany({ columns: { jezikId: true } });
  if (existingLang.length === 0) {
    await db.insert(schema.jezik).values(languages.map((naziv) => ({ naziv })));
    console.log("Ubaceni jezici");
  } else {
    console.log("Jezici vec postoje, preskacem");
  }

  const allLangs = await db.query.jezik.findMany({
    columns: { jezikId: true, naziv: true },
  });
  const langIdByName = new Map(allLangs.map((l) => [l.naziv, l.jezikId]));

  // 2) Admin korisnik (ne kroz public register)
  const adminEmail = "admin@test.com";
  const adminExists = await db.query.korisnik.findFirst({
    where: (k, { eq }) => eq(k.email, adminEmail),
    columns: { korisnikId: true },
  });

  if (!adminExists) {
    const hashed = await bcrypt.hash("Admin123!", 10);

    const ins = await db.insert(schema.korisnik).values({
      ime: "Admin",
      prezime: "Adminovic",
      email: adminEmail,
      lozinka: hashed,
      statusNaloga: "AKTIVAN",
    });

    const adminId = Number(ins[0].insertId);

    //  ubaci i u tabelu administrator
    await db.insert(schema.administrator).values({ korisnikId: adminId });

    console.log("Ubacen admin (admin@test.com / Admin123!)");
  } else {
    console.log("Admin vec postoji, preskacem");
  }

  // 3) Par tutora + tutor_jezik
  const tutors = [
    {
      ime: "Mila",
      prezime: "Jovanovic",
      email: "mila.tutor@test.com",
      lozinka: "Tutor123!",
      biografija: "Strpljiva, fokus na konverzaciju i izgovor 🙂",
      cenaPoCasu: "1200.00",
      verifikovan: true,
      jezici: [
        { naziv: "Engleski", nivo: "C1" as const },
        { naziv: "Nemački", nivo: "B2" as const },
      ],
    },
    {
      ime: "Nikola",
      prezime: "Petrovic",
      email: "nikola.tutor@test.com",
      lozinka: "Tutor123!",
      biografija: "Gramatika bez muke 😄",
      cenaPoCasu: "900.00",
      verifikovan: false,
      jezici: [{ naziv: "Engleski", nivo: "B2" as const }],
    },
  ];

  for (const t of tutors) {
    const exists = await db.query.korisnik.findFirst({
      where: (k, { eq }) => eq(k.email, t.email),
      columns: { korisnikId: true },
    });

    if (exists) {
      console.log(`Tutor ${t.email} vec postoji, preskacem`);
      continue;
    }

    const hashed = await bcrypt.hash(t.lozinka, 10);

    const ins = await db.insert(schema.korisnik).values({
      ime: t.ime,
      prezime: t.prezime,
      email: t.email,
      lozinka: hashed,
      statusNaloga: "AKTIVAN",
    });

    const tutorId = Number(ins[0].insertId);

    await db.insert(schema.tutor).values({
      korisnikId: tutorId,
      biografija: t.biografija,
      cenaPoCasu: t.cenaPoCasu,
      verifikovan: t.verifikovan,
      prosecnaOcena: "0.00",
    });

    // tutor_jezik
    for (const j of t.jezici) {
      const jezikId = langIdByName.get(j.naziv);
      if (!jezikId) continue;

      await db.insert(schema.tutorJezik).values({
        tutorId,
        jezikId,
        nivo: j.nivo,
      });
    }

    console.log(`Ubacen tutor ${t.email}`);
  }

  // 4) ucenik za test login + rezervacije 
  const studentEmail = "ucenik@test.com";
  const studentExists = await db.query.korisnik.findFirst({
    where: (k, { eq }) => eq(k.email, studentEmail),
    columns: { korisnikId: true },
  });

  if (!studentExists) {
    const hashed = await bcrypt.hash("Ucenik123!", 10);

    const ins = await db.insert(schema.korisnik).values({
      ime: "Ana",
      prezime: "Ucenik",
      email: studentEmail,
      lozinka: hashed,
      statusNaloga: "AKTIVAN",
    });

    const ucenikId = Number(ins[0].insertId);

    await db.insert(schema.ucenik).values({
      korisnikId: ucenikId,
      ukupanBrojCasova: 0,
    });

    console.log("Ubacen ucenik (ucenik@test.com / Ucenik123!)");
  } else {
    console.log("Ucenik vec postoji, preskacem");
  }

  // 4b) par odrzanih rezervacija (za test recenzija)
  const tutorRow = await db.query.korisnik.findFirst({
    where: (k, { eq }) => eq(k.email, "mila.tutor@test.com"),
    columns: { korisnikId: true },
  });

  const ucenikRow2 = await db.query.korisnik.findFirst({
    where: (k, { eq }) => eq(k.email, studentEmail),
    columns: { korisnikId: true },
  });

  if (tutorRow && ucenikRow2) {
    const today = new Date();
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
    const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    await db.insert(schema.termin).values([
      {
        tutorId: tutorRow.korisnikId,
        datum: d1,
        vremeOd: "10:00:00",
        vremeDo: "11:00:00",
        status: "REZERVISAN",
      },
      {
        tutorId: tutorRow.korisnikId,
        datum: d2,
        vremeOd: "12:00:00",
        vremeDo: "13:00:00",
        status: "REZERVISAN",
      },
    ]);

    const t1 = await db.query.termin.findFirst({
      where: (t, { and, eq }) =>
        and(
          eq(t.tutorId, tutorRow.korisnikId),
          eq(t.datum, d1),
          eq(t.vremeOd, "10:00:00"),
          eq(t.vremeDo, "11:00:00")
        ),
      columns: { terminId: true },
    });
    const t2 = await db.query.termin.findFirst({
      where: (t, { and, eq }) =>
        and(
          eq(t.tutorId, tutorRow.korisnikId),
          eq(t.datum, d2),
          eq(t.vremeOd, "12:00:00"),
          eq(t.vremeDo, "13:00:00")
        ),
      columns: { terminId: true },
    });

    const terminId1 = t1?.terminId;
    const terminId2 = t2?.terminId;

    if (terminId1 && terminId2) {
      const existing = await db.query.rezervacija.findMany({
        where: (r, { inArray }) => inArray(r.terminId, [terminId1, terminId2]),
        columns: { terminId: true },
      });
      const existingIds = new Set(existing.map((e) => e.terminId));
      const toInsert = [
        {
          terminId: terminId1,
          ucenikId: ucenikRow2.korisnikId,
          status: "ODRZANA" as const,
        },
        {
          terminId: terminId2,
          ucenikId: ucenikRow2.korisnikId,
          status: "ODRZANA" as const,
        },
      ].filter((r) => !existingIds.has(r.terminId));

      if (toInsert.length > 0) {
        await db.insert(schema.rezervacija).values(toInsert);
      }
    }

    console.log("Ubacene odrzane rezervacije (primer)");
  }

  // 5) bedzevi + dodela bedzeva uceniku (primer)
  const badges = [
    { naziv: "Prvi čas", opis: "Završen prvi čas u sistemu." },
    { naziv: "Pet zvezdica", opis: "Ostavljena recenzija sa 5." },
    { naziv: "Redovan učenik", opis: "Održano 5+ časova." },
    { naziv: "Lojalan", opis: "Više od 10 rezervacija." },
  ];

  const existingBadges = await db.query.bedz.findMany({
    columns: { bedzId: true },
  });

  if (existingBadges.length === 0) {
    await db.insert(schema.bedz).values(badges);
    console.log("Ubaceni bedzevi");
  } else {
    console.log("Bedzevi vec postoje, preskacem");
  }

  const ucenikRow = await db.query.korisnik.findFirst({
    where: (k, { eq }) => eq(k.email, studentEmail),
    columns: { korisnikId: true },
  });

  if (ucenikRow) {
    const allBadges = await db.query.bedz.findMany({
      columns: { bedzId: true, naziv: true },
    });

    const today = new Date();
    const badgeIds = allBadges.slice(0, 2).map((b) => b.bedzId);

    if (badgeIds.length > 0) {
      for (const bedzId of badgeIds) {
        try {
          await db.insert(schema.ucenikBedz).values({
            ucenikId: ucenikRow.korisnikId,
            bedzId,
            datumDodele: today,
          });
        } catch {
          // ignorisi duplikate
        }
      }
      console.log("Dodeljeni bedzevi uceniku (primer)");
    }
  }

  console.log("Seed gotov!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed pao:", e);
  process.exit(1);
});
