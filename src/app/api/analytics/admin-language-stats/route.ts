import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { desc, eq, sql } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-server";
import { getCountryForLanguage } from "@/lib/language-country";

type CountryApiPayload = {
  name?: { common?: string };
  flag?: string;
  capital?: string[];
  currencies?: Record<string, { name?: string; symbol?: string }>;
};

type ExchangeApiPayload = {
  rates?: Record<string, number>;
};

async function fetchCountrySummary(countryCode: string, fallbackCurrency: string) {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,flag,capital,currencies`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as CountryApiPayload[] | CountryApiPayload;
    const country = Array.isArray(payload) ? payload[0] : payload;
    if (!country) return null;
    const currencyCode = country.currencies ? Object.keys(country.currencies)[0] : fallbackCurrency;
    const currency = currencyCode ? country.currencies?.[currencyCode] : null;
    return {
      countryName: country.name?.common ?? null,
      flagEmoji: country.flag ?? null,
      capital: country.capital?.[0] ?? null,
      currencyCode: currencyCode ?? fallbackCurrency,
      currencyName: currency?.name ?? null,
      currencySymbol: currency?.symbol ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchExchangeRate(base: string, symbol: string) {
  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbol)}`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as ExchangeApiPayload;
    return payload.rates?.[symbol] ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemate pravo pristupa." }, { status: 403 });
  }

  const rows = await db
    .select({
      jezikId: schema.jezik.jezikId,
      languageName: schema.jezik.naziv,
      tutorCount: sql<number>`count(distinct ${schema.tutorJezik.tutorId})`,
      averagePrice: sql<string>`avg(${schema.tutor.cenaPoCasu})`,
    })
    .from(schema.tutorJezik)
    .innerJoin(schema.jezik, eq(schema.jezik.jezikId, schema.tutorJezik.jezikId))
    .innerJoin(schema.tutor, eq(schema.tutor.korisnikId, schema.tutorJezik.tutorId))
    .groupBy(schema.jezik.jezikId, schema.jezik.naziv)
    .orderBy(desc(sql`count(distinct ${schema.tutorJezik.tutorId})`));

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const mapped = getCountryForLanguage(row.languageName);
      const country = await fetchCountrySummary(mapped.countryCode, mapped.currency);
      const currencyCode = country?.currencyCode ?? mapped.currency;
      const eurRate = await fetchExchangeRate("EUR", currencyCode);

      return {
        jezikId: row.jezikId,
        languageName: row.languageName,
        tutorCount: Number(row.tutorCount ?? 0),
        averagePriceRsd: Number(row.averagePrice ?? 0),
        countryCode: mapped.countryCode,
        countryName: country?.countryName ?? null,
        countryCapital: country?.capital ?? null,
        flagEmoji: country?.flagEmoji ?? null,
        currencyCode,
        currencyName: country?.currencyName ?? null,
        currencySymbol: country?.currencySymbol ?? null,
        eurRateToCurrency: eurRate,
      };
    })
  );

  return NextResponse.json({ stats: enriched }, { status: 200 });
}
