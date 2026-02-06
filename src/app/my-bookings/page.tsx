"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";

type MeUser = { korisnikId: number; role: "UCENIK" | "TUTOR" | "ADMIN" };
type Termin = {
  terminId: number;
  tutorId: number;
  datum: string;
  vremeOd: string;
  vremeDo: string;
  status: "SLOBODAN" | "REZERVISAN" | "OTKAZAN";
};

type Rezervacija = {
  rezervacijaId: number;
  terminId: number;
  ucenikId: number;
  status: "AKTIVNA" | "OTKAZANA" | "ODRZANA";
};

type BookingRow = {
  rezervacijaId: number;
  terminId: number;
  ucenikId?: number;
  status: Rezervacija["status"];
  datum: string;
  vremeOd: string;
  vremeDo: string;
  tutorId?: number;
  tutorIme?: string;
  tutorPrezime?: string;
  cenaPoCasu?: string;
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

function formatPrice(value?: string) {
  if (!value) return "-";
  return `${value} RSD`;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [studentFilter, setStudentFilter] = useState<
    "AKTIVNA" | "OTKAZANA" | "ODRZANA" | "SVE"
  >("AKTIVNA");
  const [tutorFilter, setTutorFilter] = useState<
    "AKTIVNA" | "OTKAZANA" | "ODRZANA" | "SVE"
  >("AKTIVNA");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (!data?.user) {
        router.replace("/login");
        return;
      }
      if (data.user.role !== "TUTOR" && data.user.role !== "UCENIK") {
        router.replace("/me");
        return;
      }
      setMe({ korisnikId: data.user.korisnikId, role: data.user.role });
    })();
  }, [router]);

  const grouped = useMemo(() => {
    if (rows.length === 0) return [];
    const source =
      me?.role === "UCENIK" && studentFilter !== "SVE"
        ? rows.filter((r) => r.status === studentFilter)
        : me?.role === "TUTOR" && tutorFilter !== "SVE"
          ? rows.filter((r) => r.status === tutorFilter)
          : rows;
    if (source.length === 0) return [];
    const map = new Map<string, BookingRow[]>();
    for (const r of source) {
      const key = r.datum?.split("T")[0] ?? r.datum;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(r);
    }
    return Array.from(map.entries())
      .map(([dateKey, items]) => ({
        dateKey,
        items: [...items].sort((a, b) => a.vremeOd.localeCompare(b.vremeOd)),
      }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [rows, me?.role, studentFilter, tutorFilter]);

  useEffect(() => {
    if (!me) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (me.role === "TUTOR") {
          const tRes = await fetch(`/api/termini?tutorId=${me.korisnikId}`);
          const tData = await tRes.json();
          const termini: Termin[] = tData?.termini ?? [];

          if (termini.length === 0) {
            setRows([]);
            setLoading(false);
            return;
          }

          const reservations = await Promise.all(
            termini.map(async (t) => {
              const res = await fetch(`/api/rezervacije?terminId=${t.terminId}`);
              const data = await res.json();
              const list: Rezervacija[] = data?.rezervacije ?? [];
              return list.map((r) => ({
                rezervacijaId: r.rezervacijaId,
                terminId: r.terminId,
                ucenikId: r.ucenikId,
                status: r.status,
                datum: t.datum,
                vremeOd: t.vremeOd,
                vremeDo: t.vremeDo,
                tutorId: t.tutorId,
              }));
            })
          );

          setRows(reservations.flat());
          return;
        }

        const rRes = await fetch("/api/rezervacije/ucenik");
        const rData = await rRes.json();
        const rezervacije: BookingRow[] = rData?.rezervacije ?? [];

        if (rezervacije.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }
        setRows(rezervacije);
        try {
          const revRes = await fetch(`/api/recenzije?ucenikId=${me.korisnikId}`);
          const revData = await revRes.json();
          const list: Array<{ rezervacijaId: number }> = revData?.recenzije ?? [];
          const map: Record<number, boolean> = {};
          list.forEach((r) => {
            map[r.rezervacijaId] = true;
          });
          setReviewedIds(map);
        } catch {
          setReviewedIds({});
        }
      } catch {
        setError("Greška pri učitavanju rezervacija.");
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
        <h1 className="text-2xl font-semibold text-slate-900">Moje rezervacije</h1>
        <p className="mt-2 text-sm text-slate-600">
          {me?.role === "TUTOR"
            ? "Prikaz rezervacija koje se odnose na vaše termine."
            : "Prikaz rezervacija koje ste napravili kod tutora."}
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6">
          {me?.role === "UCENIK" && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Filter:</span>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={studentFilter}
                onChange={(e) =>
                  setStudentFilter(e.target.value as typeof studentFilter)
                }
              >
                <option value="AKTIVNA">Aktivne</option>
                <option value="ODRZANA">Održane</option>
                <option value="OTKAZANA">Otkazane</option>
                <option value="SVE">Sve</option>
              </select>
            </div>
          )}
          {me?.role === "TUTOR" && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Filter:</span>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={tutorFilter}
                onChange={(e) =>
                  setTutorFilter(e.target.value as typeof tutorFilter)
                }
              >
                <option value="AKTIVNA">Aktivne</option>
                <option value="ODRZANA">Održane</option>
                <option value="OTKAZANA">Otkazane</option>
                <option value="SVE">Sve</option>
              </select>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-slate-600">Učitavam rezervacije...</p>
          ) : grouped.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
              Trenutno nema rezervacija.
            </div>
          ) : (
            <div className="grid gap-5">
              {grouped.map((g) => (
                <div
                  key={g.dateKey}
                  className="rounded-2xl border border-slate-200 bg-white/90 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatDate(g.dateKey)}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {g.items.length} rezervacija
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div
                      className={`grid ${
                        me?.role === "UCENIK"
                          ? "grid-cols-[140px_1fr_140px_120px]"
                          : "grid-cols-[140px_1fr_120px]"
                      } bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600`}
                    >
                      <span>Vreme</span>
                      <span>{me?.role === "TUTOR" ? "Učenik" : "Tutor"}</span>
                      {me?.role === "UCENIK" && <span>Cena</span>}
                      <span className="text-right">Status</span>
                    </div>
                    {g.items.map((r, idx) => (
                      <div
                        key={r.rezervacijaId}
                        className={`grid ${
                          me?.role === "UCENIK"
                            ? "grid-cols-[140px_1fr_140px_120px]"
                            : "grid-cols-[140px_1fr_120px]"
                        } items-center px-4 py-2 text-sm ${
                          idx === g.items.length - 1 ? "" : "border-b border-slate-100"
                        }`}
                      >
                        <span className="font-medium text-slate-900">
                          {formatTime(r.vremeOd)} - {formatTime(r.vremeDo)}
                        </span>
                        {me?.role === "TUTOR" ? (
                          <span className="text-slate-700">ID: {r.ucenikId}</span>
                        ) : (
                          <span className="text-slate-700">
                            <Link
                              className="font-semibold text-blue-700 hover:text-blue-800"
                              href={`/tutors/${r.tutorId}`}
                            >
                              {r.tutorIme} {r.tutorPrezime}
                            </Link>
                          </span>
                        )}
                        {me?.role === "UCENIK" && (
                          <span className="text-slate-700">{formatPrice(r.cenaPoCasu)}</span>
                        )}
                        <span className="text-right">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                            {r.status}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {me?.role === "UCENIK" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {g.items.map((r) => (
                        r.status === "AKTIVNA" && (
                          <Button
                            key={`cancel-${r.rezervacijaId}`}
                            variant="danger"
                            size="sm"
                            disabled={cancelingId === r.rezervacijaId}
                            onClick={async () => {
                              const ok = window.confirm(
                                "Da li ste sigurni da želite da otkažete rezervaciju?"
                              );
                              if (!ok) return;
                              setError(null);
                              setCancelingId(r.rezervacijaId);
                              try {
                                const res = await fetch(`/api/rezervacije/${r.rezervacijaId}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "OTKAZANA" }),
                                });
                                const data = await res.json();
                                if (!res.ok) {
                                  setError(data?.error || "Greška pri otkazivanju.");
                                  return;
                                }
                                setRows((prev) =>
                                  prev.map((x) =>
                                    x.rezervacijaId === r.rezervacijaId
                                      ? { ...x, status: "OTKAZANA" }
                                      : x
                                  )
                                );
                              } finally {
                                setCancelingId(null);
                              }
                            }}
                          >
                            Otkaži
                          </Button>
                        )
                      ))}
                    </div>
                  )}
                  {me?.role === "UCENIK" && (
                    <div className="mt-4 grid gap-3">
                      {g.items.map((r) => (
                        r.status === "ODRZANA" && (
                          <div key={`review-${r.rezervacijaId}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-slate-900">
                                Recenzija za termin {formatTime(r.vremeOd)} - {formatTime(r.vremeDo)}
                              </span>
                              {reviewedIds[r.rezervacijaId] ? (
                                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                                  Recenzija poslata
                                </span>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setReviewMsg(null);
                                    setReviewingId(r.rezervacijaId);
                                    setReviewRating("5");
                                    setReviewComment("");
                                  }}
                                >
                                  Ostavi recenziju
                                </Button>
                              )}
                            </div>

                            {reviewingId === r.rezervacijaId && !reviewedIds[r.rezervacijaId] && (
                              <div className="mt-3 grid gap-3">
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                  Ocena
                                  <select
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                                    value={reviewRating}
                                    onChange={(e) => setReviewRating(e.target.value)}
                                  >
                                    <option value="5">5</option>
                                    <option value="4">4</option>
                                    <option value="3">3</option>
                                    <option value="2">2</option>
                                    <option value="1">1</option>
                                  </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                  Komentar (opciono)
                                  <textarea
                                    className="min-h-[90px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
                                    placeholder="Napiši kratak komentar..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                  />
                                </label>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={reviewSaving}
                                    onClick={async () => {
                                      setReviewMsg(null);
                                      setReviewSaving(true);
                                      try {
                                        const res = await fetch("/api/recenzije", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            rezervacijaId: r.rezervacijaId,
                                            ocena: Number(reviewRating),
                                            komentar: reviewComment.trim() || null,
                                          }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) {
                                          setReviewMsg(data?.error || "Greška pri slanju recenzije.");
                                          if (res.status === 409) {
                                            setReviewedIds((prev) => ({
                                              ...prev,
                                              [r.rezervacijaId]: true,
                                            }));
                                          }
                                          return;
                                        }
                                        setReviewedIds((prev) => ({
                                          ...prev,
                                          [r.rezervacijaId]: true,
                                        }));
                                        setReviewMsg("Recenzija je poslata.");
                                        setReviewingId(null);
                                      } finally {
                                        setReviewSaving(false);
                                      }
                                    }}
                                  >
                                    {reviewSaving ? "Šaljem..." : "Pošalji"}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setReviewingId(null)}
                                  >
                                    Odustani
                                  </Button>
                                </div>
                                {reviewMsg && (
                                  <p className="text-sm text-slate-700">{reviewMsg}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
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
