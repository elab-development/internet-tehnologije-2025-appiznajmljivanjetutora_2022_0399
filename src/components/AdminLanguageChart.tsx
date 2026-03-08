"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

type LanguageStat = {
  language: string;
  tutorCount: number;
  avgPriceRsd: number;
  verifiedCount: number;
};

type ExchangeRates = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

declare global {
  interface Window {
    google?: {
      charts: {
        load: (version: string, options: { packages: string[] }) => void;
        setOnLoadCallback: (callback: () => void) => void;
      };
      visualization: {
        arrayToDataTable: (data: unknown[][]) => unknown;
        ColumnChart: new (element: Element | null) => {
          draw: (data: unknown, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function AdminLanguageChart() {
  const [stats, setStats] = useState<LanguageStat[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, ratesRes] = await Promise.all([
          fetch("/api/analytics/admin-language-stats"),
          fetch("/api/external/exchange-rates"),
        ]);

        const statsData = await statsRes.json();
        const ratesData = await ratesRes.json();

        if (!statsRes.ok) {
          setError(statsData?.error || "Greska pri ucitavanju statistike.");
          return;
        }
        if (!ratesRes.ok) {
          setError(ratesData?.error || "Greska pri ucitavanju kurseva.");
          return;
        }

        setStats(statsData?.stats ?? []);
        setRates(ratesData ?? null);
      } catch {
        setError("Spoljni API podaci trenutno nisu dostupni.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!chartReady || !window.google || stats.length === 0) return;

    window.google.charts.load("current", { packages: ["corechart"] });
    window.google.charts.setOnLoadCallback(() => {
      const data = window.google?.visualization.arrayToDataTable([
        ["Jezik", "Broj tutora", "Verifikovani tutori"],
        ...stats.map((item) => [item.language, Number(item.tutorCount), Number(item.verifiedCount)]),
      ]);

      const ChartCtor = window.google?.visualization.ColumnChart;
      if (!ChartCtor) return;
      const chart = new ChartCtor(document.getElementById("admin-language-chart"));

      chart.draw(data, {
        title: "Tutori po jeziku",
        backgroundColor: "transparent",
        legend: { position: "top" },
        colors: ["#2563eb", "#0f766e"],
        chartArea: { width: "80%", height: "70%" },
        hAxis: { textStyle: { color: "#334155" } },
        vAxis: { minValue: 0, textStyle: { color: "#334155" } },
      });
    });
  }, [chartReady, stats]);

  const avgRsd =
    stats.length > 0
      ? stats.reduce((acc, item) => acc + Number(item.avgPriceRsd || 0), 0) / stats.length
      : 0;
  const avgEur =
    rates?.rates?.EUR && avgRsd ? (avgRsd / Number(rates.rates.EUR)).toFixed(2) : null;
  const avgUsd =
    rates?.rates?.USD && avgRsd ? (avgRsd / Number(rates.rates.USD)).toFixed(2) : null;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
      <Script
        src="https://www.gstatic.com/charts/loader.js"
        strategy="afterInteractive"
        onLoad={() => setChartReady(true)}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Vizualizacija po jezicima</h3>
          <p className="mt-1 text-sm text-slate-600">
            Google Charts prikaz broja tutora i verifikovanih profila po jeziku.
          </p>
        </div>
        {rates && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <div>Kursna lista ({rates.date})</div>
            <div className="mt-1 font-semibold">
              Prosecna cena casa:
              {" "}
              {avgRsd.toFixed(0)} RSD
              {avgEur ? ` / ${avgEur} EUR` : ""}
              {avgUsd ? ` / ${avgUsd} USD` : ""}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : (
        <div id="admin-language-chart" className="mt-6 min-h-[340px] w-full" />
      )}
    </section>
  );
}
