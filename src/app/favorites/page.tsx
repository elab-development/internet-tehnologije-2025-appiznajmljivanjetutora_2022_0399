"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TutorCard from "@/components/TutorCard";

type MeUser = { role: "UCENIK" | "TUTOR" | "ADMIN" };
type Favorite = { tutorId: number };
type Tutor = {
  tutorId: number;
  ime: string;
  prezime: string;
  cenaPoCasu: string;
  verifikovan: boolean;
  prosecnaOcena: string;
  biografija: string | null;
};

export default function FavoritesPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [favorites, setFavorites] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

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
    })();
  }, [router]);

  useEffect(() => {
    if (!me) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const favRes = await fetch("/api/favoriti");
        const favData = await favRes.json();
        const favs: Favorite[] = favData?.favoriti ?? [];
        if (favs.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        const tutors = await Promise.all(
          favs.map(async (f) => {
            const res = await fetch(`/api/tutors/${f.tutorId}`);
            const data = await res.json();
            return data?.tutor as Tutor | null;
          })
        );
        const list = tutors.filter(Boolean) as Tutor[];
        setFavorites(list);
        setFavoriteIds(new Set(list.map((t) => Number(t.tutorId))));
      } catch {
        setError("Greška pri učitavanju favorita.");
      } finally {
        setLoading(false);
      }
    })();
  }, [me]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold text-slate-900">Moji favoriti</h1>
          <p className="mt-2 text-sm text-slate-600">
            Lista tutora koje ste sačuvali kao omiljene.
          </p>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6">
            {loading ? (
              <p className="text-sm text-slate-600">Učitavam favorite...</p>
            ) : favorites.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                Trenutno nema favorita.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {favorites.map((t) => (
                  <TutorCard
                    key={t.tutorId}
                    href={`/tutors/${t.tutorId}`}
                    ime={t.ime}
                    prezime={t.prezime}
                    cenaPoCasu={t.cenaPoCasu}
                    verifikovan={t.verifikovan}
                    prosecnaOcena={t.prosecnaOcena}
                    biografija={t.biografija}
                    isFavorite={favoriteIds.has(t.tutorId)}
                    onToggleFavorite={async () => {
                      setError(null);
                      const res = await fetch("/api/favoriti", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tutorId: t.tutorId }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setError(data?.error || "Greška pri uklanjanju favorita.");
                        return;
                      }
                      setFavorites((prev) => prev.filter((x) => x.tutorId !== t.tutorId));
                      setFavoriteIds((prev) => {
                        const next = new Set(prev);
                        next.delete(t.tutorId);
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
