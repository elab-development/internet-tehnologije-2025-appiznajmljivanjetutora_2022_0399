"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/Input";
import TutorCard from "@/components/TutorCard";

type User = { role: "UCENIK" | "TUTOR" | "ADMIN" };
type Language = { jezikId: number; naziv: string };

type Tutor = {
  tutorId: number;
  ime: string;
  prezime: string;
  cenaPoCasu: string;
  verifikovan: boolean;
  prosecnaOcena: string;
  biografija: string | null;
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export default function TutorsPage() {
  const router = useRouter();

  const [me, setMe] = useState<User | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);

  const [languageId, setLanguageId] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [verified, setVerified] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [maxPriceLimit, setMaxPriceLimit] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (!data?.user) {
        router.replace("/login");
        return;
      }
      if (data.user.role !== "UCENIK") {
        router.replace("/me");
        return;
      }

      setMe({ role: data.user.role });

      const langRes = await fetch("/api/languages");
      const langData = await langRes.json();
      setLanguages(langData.languages || []);
    })();
  }, [router]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (verified) p.set("verified", "true");
    if (maxPrice > 0) p.set("maxPrice", String(maxPrice));
    if (languageId) p.set("languageId", languageId);
    if (level) p.set("level", level);
    return p.toString();
  }, [verified, maxPrice, languageId, level]);

  useEffect(() => {
    if (!me) return;

    (async () => {
      const res = await fetch(`/api/tutors${query ? `?${query}` : ""}`);
      const data = await res.json();
      setTutors(data.tutors || []);
      const limit = Number(data.maxPrice ?? 0);
      setMaxPriceLimit(Number.isFinite(limit) ? limit : 0);
      if (maxPrice > 0 && limit > 0 && maxPrice > limit) {
        setMaxPrice(limit);
      }
    })();
  }, [me, query]);

  if (!me) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
        <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-slate-700">Učitavam...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Pretraga tutora
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Filtriraj po jeziku, nivou i ceni kako bi brzo pronašao odgovarajućeg tutora.
              </p>
            </div>
            <a
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
              href="/me"
            >
              Nazad na moj nalog
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Jezik
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
                value={languageId}
                onChange={(e) => setLanguageId(e.target.value)}
              >
                <option value="">(svi)</option>
                {languages.map((l) => (
                  <option key={l.jezikId} value={String(l.jezikId)}>
                    {l.naziv}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nivo
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="">(svi)</option>
                {LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Maks cena
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>0</span>
                <span>{maxPrice === 0 ? "Bez limita" : `${maxPrice} RSD`}</span>
                <span>{maxPriceLimit || 0}</span>
              </div>
              <input
                type="range"
                min={0}
                max={maxPriceLimit || 0}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <input
                className="h-4 w-4 accent-blue-600"
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />
              Samo verifikovani tutori
            </label>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Rezultati</h2>
          {tutors.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-600">
              Nema tutora za izabrane filtere.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {tutors.map((t) => (
                <TutorCard
                  key={t.tutorId}
                  href={`/tutors/${t.tutorId}`}
                  ime={t.ime}
                  prezime={t.prezime}
                  cenaPoCasu={t.cenaPoCasu}
                  verifikovan={t.verifikovan}
                  prosecnaOcena={t.prosecnaOcena}
                  biografija={t.biografija}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
