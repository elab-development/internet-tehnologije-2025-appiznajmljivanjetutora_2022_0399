"use client";

import { useEffect, useMemo, useState } from "react";

type LanguageStat = {
  jezikId: number;
  languageName: string;
  tutorCount: number;
  averagePriceRsd: number;
  countryCode: string;
  countryName: string | null;
  countryCapital: string | null;
  flagEmoji: string | null;
  currencyCode: string;
  currencyName: string | null;
  currencySymbol: string | null;
  eurRateToCurrency: number | null;
};

export default function AdminLanguageChart() {
  const [stats, setStats] = useState<LanguageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analytics/admin-language-stats", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Nije moguce ucitati analytics podatke.");
          return;
        }
        setStats(data?.stats ?? []);
      } catch {
        setError("Nije moguce ucitati analytics podatke.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxTutors = useMemo(
    () => stats.reduce((max, row) => Math.max(max, row.tutorCount), 0),
    [stats]
  );

  if (loading) {
    return <p className="text-sm text-slate-600">Ucitivanje grafikona...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (stats.length === 0) {
    return <p className="text-sm text-slate-600">Nema podataka za prikaz.</p>;
  }

  return (
    <div className="grid gap-3">
      {stats.map((row) => {
        const widthPct = maxTutors > 0 ? Math.max((row.tutorCount / maxTutors) * 100, 8) : 8;
        return (
          <div
            key={row.jezikId}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-slate-900">
                {row.flagEmoji ? `${row.flagEmoji} ` : ""}
                {row.languageName}
              </div>
              <div className="text-xs text-slate-600">
                Tutora: <span className="font-semibold text-slate-900">{row.tutorCount}</span>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>Drzava: {row.countryName ?? row.countryCode}</span>
              <span>Glavni grad: {row.countryCapital ?? "-"}</span>
              <span>Prosecna cena: {row.averagePriceRsd.toFixed(2)} RSD</span>
              <span>
                EUR/{row.currencyCode}: {row.eurRateToCurrency ?? "-"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
