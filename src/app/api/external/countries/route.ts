import { NextResponse } from "next/server";
import { getCountryForLanguage } from "@/lib/language-country";

type CountryResponse = {
  name?: { common?: string };
  flags?: { svg?: string; png?: string; alt?: string };
  capital?: string[];
  region?: string;
  population?: number;
  cca2?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const languages = searchParams.getAll("language");

  if (languages.length === 0) {
    return NextResponse.json({ countries: [] }, { status: 200 });
  }

  try {
    const items = await Promise.all(
      languages.map(async (language) => {
        const country = getCountryForLanguage(language);
        if (!country) return null;

        const res = await fetch(
          `https://restcountries.com/v3.1/alpha/${country.code}?fields=name,flags,capital,region,population,cca2`,
          { next: { revalidate: 60 * 60 * 24 } }
        );
        if (!res.ok) return null;

        const data = (await res.json()) as CountryResponse | CountryResponse[];
        const item = Array.isArray(data) ? data[0] : data;
        if (!item) return null;

        return {
          language,
          code: item.cca2 ?? country.code,
          countryName: item.name?.common ?? country.label,
          capital: item.capital?.[0] ?? country.city,
          region: item.region ?? "",
          population: item.population ?? 0,
          flagUrl: item.flags?.svg ?? item.flags?.png ?? "",
          flagAlt: item.flags?.alt ?? `${country.label} zastava`,
        };
      })
    );

    return NextResponse.json(
      { countries: items.filter(Boolean) },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Countries API nije dostupan." }, { status: 502 });
  }
}
