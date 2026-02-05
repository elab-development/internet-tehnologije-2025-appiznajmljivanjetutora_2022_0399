"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";

type MeUser = { korisnikId: number; role: "UCENIK" | "TUTOR" | "ADMIN" };
type Termin = {
  terminId: number;
  tutorId: number;
  datum: string;
  vremeOd: string;
  vremeDo: string;
  status: "SLOBODAN" | "REZERVISAN" | "OTKAZAN";
};

function formatDate(value: string) {
  const raw = value?.split("T")[0] ?? "";
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return value;
  return `${d}.${m}.${y}`;
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function formatTime(value: string) {
  if (!value) return value;
  return value.slice(0, 5);
}

type GroupedTerms = {
  dateKey: string;
  terms: Termin[];
};

export default function TermsPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [termini, setTermini] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [datum, setDatum] = useState("");
  const [vremeOd, setVremeOd] = useState("");
  const [vremeDo, setVremeDo] = useState("");

  const timeOptions = useMemo(() => {
    const opts: string[] = [];
    for (let h = 7; h <= 22; h += 1) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        opts.push(`${hh}:${mm}`);
      }
    }
    return opts;
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (!data?.user) {
        router.replace("/login");
        return;
      }
      if (data.user.role !== "TUTOR") {
        router.replace("/me");
        return;
      }
      setMe({ korisnikId: data.user.korisnikId, role: data.user.role });
    })();
  }, [router]);

  const fetchTermini = useMemo(() => {
    return async (tutorId: number) => {
      const res = await fetch(`/api/termini?tutorId=${tutorId}`);
      const data = await res.json();
      setTermini(data?.termini ?? []);
      setLoading(false);
    };
  }, []);

  useEffect(() => {
    if (!me) return;
    fetchTermini(me.korisnikId);
  }, [me, fetchTermini]);

  const grouped = useMemo<GroupedTerms[]>(() => {
    if (termini.length === 0) return [];
    const map = new Map<string, Termin[]>();
    for (const t of termini) {
      const key = t.datum?.split("T")[0] ?? t.datum;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(t);
    }
    const groups = Array.from(map.entries())
      .map(([dateKey, terms]) => ({
        dateKey,
        terms: [...terms].sort((a, b) => a.vremeOd.localeCompare(b.vremeOd)),
      }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return groups;
  }, [termini]);

  async function addTermin() {
    setFormError(null);
    if (!datum || !vremeOd || !vremeDo) {
      setFormError("Datum, vreme od i vreme do su obavezni.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(datum);
    if (Number.isNaN(selected.getTime()) || selected < today) {
      setFormError("Datum mora biti današnji ili u budućnosti.");
      return;
    }
    if (vremeDo <= vremeOd) {
      setFormError("Vreme do mora biti posle vremena od.");
      return;
    }
    const newStart = timeToMinutes(vremeOd);
    const newEnd = timeToMinutes(vremeDo);
    if (!Number.isFinite(newStart) || !Number.isFinite(newEnd)) {
      setFormError("Neispravno vreme.");
      return;
    }
    const overlaps = termini.some((t) => {
      if (t.status === "OTKAZAN") return false;
      const existingDate = t.datum?.split("T")[0] ?? t.datum;
      if (existingDate !== datum) return false;
      const existingStart = timeToMinutes(t.vremeOd);
      const existingEnd = timeToMinutes(t.vremeDo);
      if (!Number.isFinite(existingStart) || !Number.isFinite(existingEnd)) return false;
      return newStart < existingEnd && newEnd > existingStart;
    });
    if (overlaps) {
      setFormError("Vreme termina se preklapa sa postojećim terminom.");
      return;
    }
    const now = new Date();
    const startDateTime = new Date(`${datum}T${vremeOd}`);
    if (Number.isNaN(startDateTime.getTime())) {
      setFormError("Neispravan datum ili vreme.");
      return;
    }
    if (startDateTime <= now) {
      setFormError("Termin mora biti u budućnosti.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/termini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datum, vremeOd, vremeDo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data?.error || "Greška pri dodavanju termina.");
        return;
      }
      setDatum("");
      setVremeOd("");
      setVremeDo("");
      if (me) await fetchTermini(me.korisnikId);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTermin(id: number) {
    setFormError(null);
    const res = await fetch(`/api/termini/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data?.error || "Greška pri brisanju termina.");
      return;
    }
    setTermini((prev) => prev.filter((t) => t.terminId !== id));
  }

  if (!me) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
        <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-slate-700">Učitavam...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">Uredi slobodne termine</h1>
        <p className="mt-2 text-sm text-slate-600">
          Definiši datum i vreme kako bi učenici mogli da rezervišu čas.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Datum
            <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Vreme od
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
              value={vremeOd}
              onChange={(e) => setVremeOd(e.target.value)}
            >
              <option value="">Izaberi...</option>
              {timeOptions.map((t) => (
                <option key={`od-${t}`} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Vreme do
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
              value={vremeDo}
              onChange={(e) => setVremeDo(e.target.value)}
            >
              <option value="">Izaberi...</option>
              {timeOptions.map((t) => (
                <option key={`do-${t}`} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}

        <div className="mt-4">
          <Button variant="primary" onClick={addTermin} disabled={saving}>
            {saving ? "Dodajem..." : "Dodaj termin"}
          </Button>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Moji termini</h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Učitavam termine...</p>
          ) : grouped.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
              Još nema definisanih termina.
            </div>
          ) : (
            <div className="mt-4 grid gap-5">
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
                      {g.terms.length} termina
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-[120px_1fr_120px] bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                      <span>Vreme</span>
                      <span>Status</span>
                      <span className="text-right">Akcije</span>
                    </div>
                    {g.terms.map((t, idx) => (
                      <div
                        key={t.terminId}
                        className={`grid grid-cols-[120px_1fr_120px] items-center px-4 py-2 text-sm ${
                          idx === g.terms.length - 1 ? "" : "border-b border-slate-100"
                        }`}
                      >
                        <span className="font-medium text-slate-900">
                          {formatTime(t.vremeOd)} - {formatTime(t.vremeDo)}
                        </span>
                        <span>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                            {t.status}
                          </span>
                        </span>
                        <div className="text-right">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteTermin(t.terminId)}
                          >
                            Obriši
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
