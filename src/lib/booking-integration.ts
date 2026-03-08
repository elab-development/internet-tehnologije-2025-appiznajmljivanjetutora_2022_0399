import { aliasedTable } from "drizzle-orm/alias";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

import { db, schema } from "@/db";

type ReservationContext = {
  rezervacijaId: number;
  terminId: number;
  datum: string;
  vremeOd: string;
  vremeDo: string;
  ucenikIme: string;
  ucenikPrezime: string;
  ucenikEmail: string;
  tutorIme: string;
  tutorPrezime: string;
  tutorEmail: string;
  googleCalendarEventId: string | null;
};

type CalendarEventResult = {
  eventId: string;
  htmlLink: string | null;
} | null;

function getDatePart(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).split("T")[0];
}

function getTimePart(value: unknown) {
  if (value instanceof Date) {
    return value.toTimeString().slice(0, 8);
  }

  const raw = String(value);
  if (raw.includes("T")) {
    return raw.split("T")[1]?.split(".")[0] ?? raw;
  }

  return raw;
}

function getCalendarConfig() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!calendarId || !clientEmail || !privateKey) {
    return null;
  }

  return { calendarId, clientEmail, privateKey };
}

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export async function getReservationContext(rezervacijaId: number) {
  const ucenik = aliasedTable(schema.korisnik, "ucenik_korisnik");
  const tutor = aliasedTable(schema.korisnik, "tutor_korisnik");

  const rows = await db
    .select({
      rezervacijaId: schema.rezervacija.rezervacijaId,
      terminId: schema.rezervacija.terminId,
      datum: schema.termin.datum,
      vremeOd: schema.termin.vremeOd,
      vremeDo: schema.termin.vremeDo,
      ucenikIme: ucenik.ime,
      ucenikPrezime: ucenik.prezime,
      ucenikEmail: ucenik.email,
      tutorIme: tutor.ime,
      tutorPrezime: tutor.prezime,
      tutorEmail: tutor.email,
      googleCalendarEventId: schema.rezervacija.googleCalendarEventId,
    })
    .from(schema.rezervacija)
    .innerJoin(schema.termin, eq(schema.termin.terminId, schema.rezervacija.terminId))
    .innerJoin(ucenik, eq(ucenik.korisnikId, schema.rezervacija.ucenikId))
    .innerJoin(tutor, eq(tutor.korisnikId, schema.termin.tutorId))
    .where(eq(schema.rezervacija.rezervacijaId, rezervacijaId));

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    rezervacijaId: row.rezervacijaId,
    terminId: row.terminId,
    datum: getDatePart(row.datum),
    vremeOd: getTimePart(row.vremeOd),
    vremeDo: getTimePart(row.vremeDo),
    ucenikIme: row.ucenikIme,
    ucenikPrezime: row.ucenikPrezime,
    ucenikEmail: row.ucenikEmail,
    tutorIme: row.tutorIme,
    tutorPrezime: row.tutorPrezime,
    tutorEmail: row.tutorEmail,
    googleCalendarEventId: row.googleCalendarEventId,
  } satisfies ReservationContext;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const config = getEmailConfig();
  if (!config) {
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Slanje email-a nije uspelo: ${details}`);
  }
}

function getLessonSummary(context: ReservationContext) {
  const tutor = `${context.tutorIme} ${context.tutorPrezime}`;
  const ucenik = `${context.ucenikIme} ${context.ucenikPrezime}`;
  const termin = `${context.datum} ${context.vremeOd} - ${context.vremeDo}`;

  return { tutor, ucenik, termin };
}

export async function sendReservationCreatedEmails(
  context: ReservationContext,
  calendarEventLink?: string | null
) {
  if (!getEmailConfig()) {
    return;
  }

  const { tutor, ucenik, termin } = getLessonSummary(context);
  const calendarHtml = calendarEventLink
    ? `<p>Google Calendar dogadjaj: <a href="${calendarEventLink}">${calendarEventLink}</a></p>`
    : "";

  await Promise.all([
    sendEmail({
      to: context.ucenikEmail,
      subject: "Rezervacija casa je uspesno kreirana",
      html: `
        <p>Zdravo ${ucenik},</p>
        <p>Rezervisali ste cas sa tutorom ${tutor}.</p>
        <p>Termin: ${termin}</p>
        ${calendarHtml}
      `,
    }),
    sendEmail({
      to: context.tutorEmail,
      subject: "Imate novu rezervaciju casa",
      html: `
        <p>Zdravo ${tutor},</p>
        <p>Ucenik ${ucenik} je rezervisao cas.</p>
        <p>Termin: ${termin}</p>
        ${calendarHtml}
      `,
    }),
  ]);
}

export async function sendReservationCanceledEmails(context: ReservationContext) {
  if (!getEmailConfig()) {
    return;
  }

  const { tutor, ucenik, termin } = getLessonSummary(context);

  await Promise.all([
    sendEmail({
      to: context.ucenikEmail,
      subject: "Rezervacija casa je otkazana",
      html: `
        <p>Zdravo ${ucenik},</p>
        <p>Rezervacija casa sa tutorom ${tutor} je otkazana.</p>
        <p>Termin: ${termin}</p>
      `,
    }),
    sendEmail({
      to: context.tutorEmail,
      subject: "Cas je otkazan",
      html: `
        <p>Zdravo ${tutor},</p>
        <p>Cas sa ucenikom ${ucenik} je otkazan.</p>
        <p>Termin: ${termin}</p>
      `,
    }),
  ]);
}

export async function createGoogleCalendarEvent(
  context: ReservationContext
): Promise<CalendarEventResult> {
  const config = getCalendarConfig();
  if (!config) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });
  const startDateTime = `${context.datum}T${context.vremeOd}`;
  const endDateTime = `${context.datum}T${context.vremeDo}`;
  const summary = `Cas jezika: ${context.ucenikIme} ${context.ucenikPrezime} / ${context.tutorIme} ${context.tutorPrezime}`;

  const response = await calendar.events.insert({
    calendarId: config.calendarId,
    requestBody: {
      summary,
      description: `Rezervacija #${context.rezervacijaId}`,
      start: {
        dateTime: startDateTime,
        timeZone: "Europe/Belgrade",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "Europe/Belgrade",
      },
      attendees: [
        { email: context.ucenikEmail },
        { email: context.tutorEmail },
      ],
    },
  });

  if (!response.data.id) {
    throw new Error("Google Calendar nije vratio event ID.");
  }

  return {
    eventId: response.data.id,
    htmlLink: response.data.htmlLink ?? null,
  };
}

export async function deleteGoogleCalendarEvent(eventId: string | null) {
  const config = getCalendarConfig();
  if (!config || !eventId) {
    return;
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({
    calendarId: config.calendarId,
    eventId,
  });
}
