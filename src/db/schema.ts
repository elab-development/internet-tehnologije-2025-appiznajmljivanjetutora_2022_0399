import { sql } from "drizzle-orm";
import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  boolean,
  datetime,
  date,
  time,
  mysqlEnum,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/mysql-core";
// --------------------
// KORISNIK + PODTIPOVI
// --------------------
export const korisnik = mysqlTable(
  "korisnik",
  {
    korisnikId: int("korisnik_id", { unsigned: true })
      .primaryKey()
      .autoincrement(),

    ime: varchar("ime", { length: 100 }).notNull(),
    prezime: varchar("prezime", { length: 100 }).notNull(),
    email: varchar("email", { length: 190 }).notNull(),
    lozinka: varchar("lozinka", { length: 255 }).notNull(),

    statusNaloga: mysqlEnum("status_naloga", ["AKTIVAN", "BLOKIRAN"])
      .notNull()
      .default("AKTIVAN"),
  },
  (t) => ({
    uxEmail: uniqueIndex("ux_korisnik_email").on(t.email),
  })
);

export const ucenik = mysqlTable("ucenik", {
  korisnikId: int("korisnik_id", { unsigned: true })
    .primaryKey()
    .references(() => korisnik.korisnikId, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  ukupanBrojCasova: int("ukupan_broj_casova").notNull().default(0),
});

export const tutor = mysqlTable(
  "tutor",
  {
    korisnikId: int("korisnik_id", { unsigned: true })
      .primaryKey()
      .references(() => korisnik.korisnikId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    biografija: text("biografija"),
    cenaPoCasu: decimal("cena_po_casu", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    verifikovan: boolean("verifikovan").notNull().default(false),
    prosecnaOcena: decimal("prosecna_ocena", { precision: 3, scale: 2 })
      .notNull()
      .default("0.00"),
  },
  (t) => ({
    idxCena: index("idx_tutor_cena").on(t.cenaPoCasu),
    idxVerifikovan: index("idx_tutor_verifikovan").on(t.verifikovan),
  })
);


export const administrator = mysqlTable("administrator", {
  korisnikId: int("korisnik_id", { unsigned: true })
    .primaryKey()
    .references(() => korisnik.korisnikId, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

// --------------------
// ZAHTEV ZA VERIFIKACIJU
// --------------------
export const zahtevVerifikacije = mysqlTable(
  "zahtev_verifikacije",
  {
    zahtevId: int("zahtev_id", { unsigned: true })
      .primaryKey()
      .autoincrement(),

    tutorId: int("tutor_id", { unsigned: true })
      .notNull()
      .references(() => tutor.korisnikId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    adminId: int("admin_id", { unsigned: true }).references(
      () => administrator.korisnikId,
      { onDelete: "set null", onUpdate: "cascade" }
    ),

    status: mysqlEnum("status_zahteva", ["NOV", "ODOBREN", "ODBIJEN"])
      .notNull()
      .default("NOV"),

    datumPodnosenja: datetime("datum_podnosenja").notNull(),
    datumOdluke: datetime("datum_odluke"),

    dokumentUrl: varchar("dokument_url", { length: 255 }).notNull(),
  },
  (t) => ({
    idxTutor: index("idx_zahtev_verif_tutor").on(t.tutorId),
    idxStatus: index("idx_zahtev_verif_status").on(t.status),
  })
);

// --------------------
// JEZIK + TUTOR_JEZIK
// --------------------
export const jezik = mysqlTable(
  "jezik",
  {
    jezikId: int("jezik_id", { unsigned: true })
      .primaryKey()
      .autoincrement(),
    naziv: varchar("naziv", { length: 80 }).notNull(),
  },
  (t) => ({
    uxNaziv: uniqueIndex("ux_jezik_naziv").on(t.naziv),
  })
);

export const tutorJezik = mysqlTable(
  "tutor_jezik",
  {
    tutorId: int("tutor_id", { unsigned: true })
      .notNull()
      .references(() => tutor.korisnikId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    jezikId: int("jezik_id", { unsigned: true })
      .notNull()
      .references(() => jezik.jezikId, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    nivo: mysqlEnum("nivo", ["A1", "A2", "B1", "B2", "C1", "C2"]).notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_tutor_jezik").on(t.tutorId, t.jezikId),
    idxTutor: index("idx_tutor_jezik_tutor").on(t.tutorId),
    idxJezik: index("idx_tutor_jezik_jezik").on(t.jezikId),
  })
);

// --------------------
// TERMIN
// --------------------
export const termin = mysqlTable(
  "termin",
  {
    terminId: int("termin_id", { unsigned: true })
      .primaryKey()
      .autoincrement(),

    tutorId: int("tutor_id", { unsigned: true })
      .notNull()
      .references(() => tutor.korisnikId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    datum: date("datum").notNull(),
    vremeOd: time("vreme_od").notNull(),
    vremeDo: time("vreme_do").notNull(),

    status: mysqlEnum("status_termina", ["SLOBODAN", "REZERVISAN", "OTKAZAN"])
      .notNull()
      .default("SLOBODAN"),
  },
  (t) => ({
    idxTutorDatum: index("idx_termin_tutor_datum").on(t.tutorId, t.datum),
  })
);

// --------------------
// REZERVACIJA
// --------------------
export const rezervacija = mysqlTable(
  "rezervacija",
  {
    rezervacijaId: int("rezervacija_id", { unsigned: true })
      .primaryKey()
      .autoincrement(),

    terminId: int("termin_id", { unsigned: true })
      .notNull()
      .references(() => termin.terminId, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    ucenikId: int("ucenik_id", { unsigned: true })
      .notNull()
      .references(() => ucenik.korisnikId, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    status: mysqlEnum("status_rezervacije", ["AKTIVNA", "OTKAZANA", "ODRZANA"])
      .notNull()
      .default("AKTIVNA"),
  },
  (t) => ({
    uxTermin: uniqueIndex("ux_rezervacija_termin").on(t.terminId),
    idxUcenik: index("idx_rezervacija_ucenik").on(t.ucenikId),
  })
);

// --------------------
// RECENZIJA
// --------------------
export const recenzija = mysqlTable(
  "recenzija",
  {
    recenzijaId: int("recenzija_id", { unsigned: true })
      .primaryKey()
      .autoincrement(),

    rezervacijaId: int("rezervacija_id", { unsigned: true })
      .notNull()
      .references(() => rezervacija.rezervacijaId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    ocena: int("ocena").notNull(),
    komentar: text("komentar"),
  },
  (t) => ({
    uxRez: uniqueIndex("ux_recenzija_rezervacija").on(t.rezervacijaId),
    chkOcena: check(
      "chk_recenzija_ocena",
      sql`${t.ocena} BETWEEN 1 AND 5`
    ),
    })
);

// --------------------
// FAVORIT
// --------------------
export const favorit = mysqlTable(
  "favorit",
  {
    ucenikId: int("ucenik_id", { unsigned: true })
      .notNull()
      .references(() => ucenik.korisnikId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    tutorId: int("tutor_id", { unsigned: true })
      .notNull()
      .references(() => tutor.korisnikId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    datumDodavanja: date("datum_dodavanja").notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_favorit_ucenik_tutor").on(t.ucenikId, t.tutorId),
    idxTutor: index("idx_favorit_tutor").on(t.tutorId),
  })
);

// --------------------
// BEDZ + UCENIK_BEDZ
// --------------------
export const bedz = mysqlTable("bedz", {
  bedzId: int("bedz_id", { unsigned: true })
    .primaryKey()
    .autoincrement(),
  naziv: varchar("naziv", { length: 120 }).notNull(),
  opis: text("opis"),
});

export const ucenikBedz = mysqlTable(
  "ucenik_bedz",
  {
    ucenikId: int("ucenik_id", { unsigned: true })
      .notNull()
      .references(() => ucenik.korisnikId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    bedzId: int("bedz_id", { unsigned: true })
      .notNull()
      .references(() => bedz.bedzId, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    datumDodele: date("datum_dodele").notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_ucenik_bedz").on(t.ucenikId, t.bedzId),
    idxBedz: index("idx_ucenik_bedz_bedz").on(t.bedzId),
  })
);

// --------------------
// ZALBA
// --------------------
export const zalba = mysqlTable(
  "zalba",
  {
    zalbaId: int("zalba_id", { unsigned: true })
      .primaryKey()
      .autoincrement(),

    opis: text("opis").notNull(),
    datumPodnosenja: datetime("datum_podnosenja").notNull(),

    status: mysqlEnum("status_zalbe", ["NOVA", "U_OBRADI", "RESENA", "ODBIJENA"])
      .notNull()
      .default("NOVA"),

    podnosilacId: int("podnosilac_id", { unsigned: true })
      .notNull()
      .references(() => korisnik.korisnikId),

    obradivacAdminId: int("obradivac_admin_id", { unsigned: true }).references(
      () => administrator.korisnikId
    ),

    tutorId: int("tutor_id", { unsigned: true }).references(
      () => tutor.korisnikId
    ),

    recenzijaId: int("recenzija_id", { unsigned: true }).references(
      () => recenzija.recenzijaId
    ),
  },
  (t) => ({
    idxPodnosilac: index("idx_zalba_podnosilac").on(t.podnosilacId),
    idxStatus: index("idx_zalba_status").on(t.status),
    chkZalbaTargetXor: check(
      "chk_zalba_target_xor",
      sql`(
        (${t.tutorId} IS NULL AND ${t.recenzijaId} IS NOT NULL)
        OR
        (${t.tutorId} IS NOT NULL AND ${t.recenzijaId} IS NULL)
      )`
    ),
    })
);
