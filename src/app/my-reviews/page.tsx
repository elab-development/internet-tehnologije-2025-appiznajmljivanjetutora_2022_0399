"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MeUser = { korisnikId: number; role: "UCENIK" | "TUTOR" | "ADMIN" };
type ReviewRow = {
  recenzijaId: number;
  rezervacijaId: number;
  ocena: number;
  komentar: string | null;
  datum: string;
  vremeOd: string;
  vremeDo: string;
  tutorId: number;
  tutorIme?: string;
  tutorPrezime?: string;
  ucenikIme?: string;
  ucenikPrezime?: string;
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

export default function MyReviewsPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (!data?.user) {
        router.replace("/login");
        return;
      }
      if (data.user.role !== "UCENIK" && data.user.role !== "TUTOR") {
        router.replace("/me");
        return;
      }
      setMe({ korisnikId: data.user.korisnikId, role: data.user.role });
    })();
  }, [router]);

  useEffect(() => {
    if (!me) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const query =
          me.role === "TUTOR"
            ? `/api/recenzije?tutorId=${me.korisnikId}`
            : `/api/recenzije?ucenikId=${me.korisnikId}`;
        const res = await fetch(query);
        const data = await res.json();
        setRows(data?.recenzije ?? []);
      } catch {
        setError("Greska pri ucitavanju recenzija.");
      } finally {
        setLoading(false);
      }
    })();
  }, [me]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">Moje recenzije</h1>
        <p className="mt-2 text-sm text-slate-600">
          {me?.role === "TUTOR"
            ? "Pregled recenzija koje ste dobili od ucenika."
            : "Pregled recenzija koje ste ostavili tutorima."}
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-600">Ucitavam recenzije...</p>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
              Jos uvek nema recenzija.
            </div>
          ) : (
            <div className="grid gap-4">
              {rows.map((r) => (
                <div
                  key={r.recenzijaId}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">
                      {me?.role === "TUTOR" ? (
                        <span>
                          {r.ucenikIme} {r.ucenikPrezime}
                        </span>
                      ) : (
                        <Link
                          className="text-blue-700 hover:text-blue-800"
                          href={`/tutors/${r.tutorId}`}
                        >
                          {r.tutorIme} {r.tutorPrezime}
                        </Link>
                      )}
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                      {r.ocena}/5
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {formatDate(r.datum)} • {formatTime(r.vremeOd)} - {formatTime(r.vremeDo)}
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
      </div>
    </main>
  );
}
