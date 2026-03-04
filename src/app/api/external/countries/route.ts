import { NextResponse } from "next/server";

type CountryApiResponse = {
  cca2: string;
  name?: { common?: string };
  capital?: string[];
  flags?: { png?: string; svg?: string };
  currencies?: Record<string, { name?: string; symbol?: string }>;
  flag?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code || code.length !== 2) {
    return NextResponse.json({ error: "Parametar 'code' mora biti ISO alpha-2 (npr. RS)." }, { status: 400 });
  }

  const upstream = await fetch(
    `https://restcountries.com/v3.1/alpha/${code}?fields=cca2,name,capital,flags,currencies,flag`,
    { cache: "no-store" }
  );

  if (!upstream.ok) {
    return NextResponse.json({ error: "REST Countries API nije dostupan." }, { status: 502 });
  }

  const payload = (await upstream.json()) as CountryApiResponse[] | CountryApiResponse;
  const country = Array.isArray(payload) ? payload[0] : payload;

  if (!country) {
    return NextResponse.json({ error: "Drzava nije pronadjena." }, { status: 404 });
  }

  const currencyCode = country.currencies ? Object.keys(country.currencies)[0] : null;
  const currencyInfo = currencyCode ? country.currencies?.[currencyCode] : null;

  return NextResponse.json(
    {
      country: {
        code: country.cca2,
        name: country.name?.common ?? null,
        capital: country.capital?.[0] ?? null,
        flagEmoji: country.flag ?? null,
        flagImage: country.flags?.png ?? country.flags?.svg ?? null,
        currency: currencyCode,
        currencyName: currencyInfo?.name ?? null,
        currencySymbol: currencyInfo?.symbol ?? null,
      },
    },
    { status: 200 }
  );
}
