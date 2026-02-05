"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/Button";

type Tutor = {
  tutorId: number;
  ime: string;
  prezime: string;
  cenaPoCasu: string;
  verifikovan: boolean;
  prosecnaOcena: string;
  biografija: string | null;
};

type Language = {
  jezikId: number;
  naziv: string;
  nivo: string;
};

export default function TutorDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    (async () => {
      setLoading(true);
      const res = await fetch(`/api/tutors/${id}`);
      const data = await res.json();
      setTutor(data?.tutor ?? null);
      setLanguages(data?.languages ?? []);
      setLoading(false);
    })();
  }, [params]);

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
        <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-slate-700">Učitavam profil tutora...</p>
        </div>
      </main>
    );
  }

  if (!tutor) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
        <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-slate-700">Tutor nije pronađen.</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push("/tutors")}>
              Nazad na pretragu
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const ocenaLabel =
    tutor.prosecnaOcena === "0.00" ||
    tutor.prosecnaOcena === "0" ||
    tutor.prosecnaOcena === "0.0"
      ? "Nema ocena"
      : tutor.prosecnaOcena;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <button
          type="button"
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-base font-semibold text-red-500 shadow-sm transition hover:bg-red-50"
          aria-label="Dodaj u favorite"
          title="Dodaj u favorite"
        >
          ♡
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {tutor.ime} {tutor.prezime}
            </h1>
            <p className="mt-1 text-sm text-slate-600">Cena: {tutor.cenaPoCasu}</p>
            <p className="mt-1 text-sm text-slate-600">Ocena: {ocenaLabel}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              tutor.verifikovan ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {tutor.verifikovan ? "Verifikovan" : "Na čekanju"}
          </span>
        </div>

        {tutor.biografija && (
          <p className="mt-4 text-sm text-slate-700">{tutor.biografija}</p>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900">Jezici i nivoi</h2>
          {languages.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Tutor još nema unete jezike.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span
                  key={`${lang.jezikId}-${lang.nivo}`}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"
                >
                  {lang.naziv} • {lang.nivo}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => router.push("/tutors")}>
            Nazad na pretragu
          </Button>
          <Button variant="primary">Rezerviši termin</Button>
        </div>
      </div>
    </main>
  );
}
