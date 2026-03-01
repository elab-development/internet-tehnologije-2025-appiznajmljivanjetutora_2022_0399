"use client";

import { useEffect, useMemo, useState } from "react";

type Language = {
  jezikId: number;
  naziv: string;
  nivo: string;
};

type CountryFact = {
  language: string;
  code: string;
  countryName: string;
  capital: string;
  region: string;
  population: number;
  flagUrl: string;
  flagAlt: string;
};

export default function LanguageCountryFacts({ languages }: { languages: Language[] }) {
  const [items, setItems] = useState<CountryFact[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uniqueLanguages = useMemo(
    () => Array.from(new Set(languages.map((item) => item.naziv))),
    [languages]
  );

  useEffect(() => {
    if (uniqueLanguages.length === 0) {
      setItems([]);
      return;
    }

    (async () => {
      try {
        const params = new URLSearchParams();
        uniqueLanguages.forEach((language) => params.append("language", language));
        const res = await fetch(`/api/external/countries?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Greska pri ucitavanju podataka o zemljama.");
          return;
        }
        setItems(data?.countries ?? []);
      } catch {
        setError("Countries API trenutno nije dostupan.");
      }
    })();
  }, [uniqueLanguages]);

  if (uniqueLanguages.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-slate-900">Jezici kroz zemlje</h2>
      <p className="mt-1 text-sm text-slate-600">
        Podaci i zastave stizu preko REST Countries API-ja.
      </p>
      {error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">Nema dodatnih podataka za prikaz.</p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={`${item.language}-${item.code}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {item.flagUrl ? (
                  <img
                    src={item.flagUrl}
                    alt={item.flagAlt}
                    className="h-10 w-14 rounded object-cover shadow-sm"
                  />
                ) : null}
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.language}</div>
                  <div className="text-xs text-slate-600">{item.countryName}</div>
                </div>
              </div>
              <div className="mt-3 grid gap-1 text-sm text-slate-700">
                <div>Glavni grad: {item.capital}</div>
                <div>Region: {item.region}</div>
                <div>Populacija: {item.population.toLocaleString("sr-RS")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
