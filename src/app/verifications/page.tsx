"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

type MeUser = { role: "UCENIK" | "TUTOR" | "ADMIN" };
type Verification = {
  zahtevId: number;
  tutorId: number;
  adminId: number | null;
  status: "NOV" | "ODOBREN" | "ODBIJEN";
  datumPodnosenja: string;
  datumOdluke: string | null;
  dokumentUrl: string;
  tutorIme: string;
  tutorPrezime: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const raw = value.split("T")[0] ?? "";
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return value;
  return `${d}.${m}.${y}`;
}

export default function VerificationsPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [items, setItems] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"SVE" | Verification["status"]>(
    "SVE"
  );
  const [actingId, setActingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (!data?.user) {
        router.replace("/login");
        return;
      }
      if (data.user.role !== "ADMIN") {
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
        const q = statusFilter === "SVE" ? "" : `?status=${statusFilter}`;
        const res = await fetch(`/api/verifikacije${q}`);
        const data = await res.json();
        setItems(data?.zahtevi ?? []);
      } catch {
        setError("Greška pri učitavanju zahteva.");
      } finally {
        setLoading(false);
      }
    })();
  }, [me, statusFilter]);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        String(a.datumPodnosenja).localeCompare(String(b.datumPodnosenja))
      ),
    [items]
  );

  async function updateStatus(id: number, status: "ODOBREN" | "ODBIJEN") {
    setError(null);
    setActingId(id);
    try {
      const res = await fetch(`/api/verifikacije/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Greška pri ažuriranju.");
        return;
      }
      setItems((prev) =>
        prev.map((x) =>
          x.zahtevId === id ? { ...x, status, datumOdluke: new Date().toISOString() } : x
        )
      );
    } finally {
      setActingId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">Pregled zahteva</h1>
        <p className="mt-2 text-sm text-slate-600">
          Zahtevi su sortirani od najstarijih po datumu podnošenja.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Filter:</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="SVE">Svi</option>
            <option value="NOV">Novi</option>
            <option value="ODOBREN">Odobreni</option>
            <option value="ODBIJEN">Odbijeni</option>
          </select>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-600">Učitavam zahteve...</p>
          ) : sorted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
              Trenutno nema zahteva.
            </div>
          ) : (
            <div className="grid gap-4">
              {sorted.map((z) => (
                <div
                  key={z.zahtevId}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {z.tutorIme} {z.tutorPrezime} (ID: {z.tutorId})
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Podnet: {formatDate(z.datumPodnosenja)} • Odluka:{" "}
                        {formatDate(z.datumOdluke)}
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                      {z.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <a
                      className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                      href={z.dokumentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Pogledaj dokument
                    </a>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={actingId === z.zahtevId || z.status === "ODOBREN"}
                      onClick={() => updateStatus(z.zahtevId, "ODOBREN")}
                    >
                      Odobri
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={actingId === z.zahtevId || z.status === "ODBIJEN"}
                      onClick={() => updateStatus(z.zahtevId, "ODBIJEN")}
                    >
                      Odbij
                    </Button>
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
