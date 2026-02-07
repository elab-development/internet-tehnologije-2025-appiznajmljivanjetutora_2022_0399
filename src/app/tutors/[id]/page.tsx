"use client";

import { useEffect, useMemo, useState } from "react";
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

type Termin = {
  terminId: number;
  tutorId: number;
  datum: string;
  vremeOd: string;
  vremeDo: string;
  status: "SLOBODAN" | "REZERVISAN" | "OTKAZAN";
};

type Review = {
  recenzijaId: number;
  rezervacijaId: number;
  ocena: number;
  komentar: string | null;
  ucenikIme: string;
  ucenikPrezime: string;
};

function formatDate(value: string) {
  const raw = value?.split("T")[0] ?? "";
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return value;
  return `${d}.${m}.${y}`;
}

function formatTime(value: string) {
  if (!value) return value;
  return value.slice(0, 5);
}

function isFutureTerm(term: Termin) {
  const datePart = term.datum?.split("T")[0] ?? term.datum;
  if (!datePart || !term.vremeDo) return true;
  const endDateTime = new Date(`${datePart}T${term.vremeDo}`);
  if (Number.isNaN(endDateTime.getTime())) return true;
  return endDateTime.getTime() > Date.now();
}

export default function TutorDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [termini, setTermini] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminiLoading, setTerminiLoading] = useState(false);
  const [terminiError, setTerminiError] = useState<string | null>(null);
  const [terminiSuccess, setTerminiSuccess] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

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

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/recenzije?tutorId=${id}`);
        const data = await res.json();
        setReviews(data?.recenzije ?? []);
      } catch {
        setReviews([]);
      }
    })();
  }, [params]);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    (async () => {
      try {
        const res = await fetch("/api/favoriti");
        const data = await res.json();
        const list: Array<{ tutorId: number }> = data?.favoriti ?? [];
        setIsFavorite(list.some((f) => String(f.tutorId) === String(id)));
      } catch {
        setIsFavorite(false);
      }
    })();
  }, [params]);

  async function toggleFavorite() {
    const id = params?.id;
    if (!id) return;
    setFavoriteError(null);
    setFavoriteLoading(true);
    try {
      const res = await fetch("/api/favoriti", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId: Number(id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFavoriteError(data?.error || "Greška pri ažuriranju favorita.");
        return;
      }
      setIsFavorite((prev) => !prev);
    } finally {
      setFavoriteLoading(false);
    }
  }

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    (async () => {
      setTerminiLoading(true);
      setTerminiError(null);
      try {
        const res = await fetch(`/api/termini?tutorId=${id}`);
        const data = await res.json();
        const list: Termin[] = data?.termini ?? [];
        setTermini(list.filter((t) => t.status === "SLOBODAN" || t.status === "OTKAZAN"));
      } catch {
        setTerminiError("Greška pri učitavanju termina.");
      } finally {
        setTerminiLoading(false);
      }
    })();
  }, [params]);

  const visibleTermini = useMemo(() => termini.filter(isFutureTerm), [termini]);

  const groupedTermini = useMemo(() => {
    if (visibleTermini.length === 0) return [];
    const map = new Map<string, Termin[]>();
    for (const t of visibleTermini) {
      const key = t.datum?.split("T")[0] ?? t.datum;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(t);
    }
    return Array.from(map.entries())
      .map(([dateKey, items]) => ({
        dateKey,
        items: [...items].sort((a, b) => a.vremeOd.localeCompare(b.vremeOd)),
      }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [termini]);

  async function reserveTermin(terminId: number) {
    setTerminiError(null);
    setTerminiSuccess(null);
    const res = await fetch("/api/rezervacije", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terminId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setTerminiError(data?.error || "Greška pri rezervaciji.");
      return;
    }
    setTermini((prev) => prev.filter((t) => t.terminId !== terminId));
    setTerminiSuccess("Rezervacija uspešna.");
  }

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

      <div className="relative mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className={`absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${
            isFavorite
              ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              : "border-red-200 bg-white text-red-500 hover:bg-red-50"
          }`}
          aria-label={isFavorite ? "Ukloni iz favorita" : "Dodaj u favorite"}
          title={isFavorite ? "Ukloni iz favorita" : "Dodaj u favorite"}
        >
          {isFavorite ? "♥" : "♡"}
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

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900">Slobodni termini</h2>
          {terminiError && <p className="mt-2 text-sm text-red-600">{terminiError}</p>}
          {terminiSuccess && <p className="mt-2 text-sm text-green-600">{terminiSuccess}</p>}
          {favoriteError && <p className="mt-2 text-sm text-red-600">{favoriteError}</p>}
          {terminiLoading ? (
            <p className="mt-2 text-sm text-slate-600">Učitavam termine...</p>
          ) : groupedTermini.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Trenutno nema slobodnih termina.</p>
          ) : (
            <div className="mt-3 grid gap-4">
              {groupedTermini.map((g) => (
                <div
                  key={g.dateKey}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>{formatDate(g.dateKey)}</span>
                    <span>{g.items.length} termina</span>
                  </div>
                  <div className="grid gap-2">
                    {g.items.map((t) => (
                      <div
                        key={t.terminId}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-900">
                          {formatTime(t.vremeOd)} - {formatTime(t.vremeDo)}
                        </span>
                        <Button variant="primary" size="sm" onClick={() => reserveTermin(t.terminId)}>
                          Rezerviši
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900">Ocene i komentari</h2>
          {reviews.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Još uvek nema recenzija.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {reviews.map((r) => (
                <div
                  key={r.recenzijaId}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>
                      {r.ucenikIme} {r.ucenikPrezime}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                      {r.ocena}/5
                    </span>
                  </div>
                  {r.komentar ? (
                    <p className="mt-2 text-sm text-slate-700">{r.komentar}</p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">Bez komentara.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => router.push("/tutors")}>
            Nazad na pretragu
          </Button>
        </div>
      </div>
    </main>
  );
}

