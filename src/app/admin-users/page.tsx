"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

type UserRow = {
  korisnikId: number;
  ime: string;
  prezime: string;
  email: string;
  statusNaloga: "AKTIVAN" | "BLOKIRAN";
  role: "ADMIN" | "TUTOR" | "UCENIK" | "KORISNIK";
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [meRole, setMeRole] = useState<string | null>(null);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<"SVE" | UserRow["role"]>("SVE");
  const [statusFilter, setStatusFilter] = useState<"SVE" | UserRow["statusNaloga"]>("SVE");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
      setMeRole(data.user.role);
    })();
  }, [router]);

  useEffect(() => {
    if (meRole !== "ADMIN") return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        setRows(data?.users ?? []);
      } catch {
        setError("Greska pri ucitavanju korisnika.");
      } finally {
        setLoading(false);
      }
    })();
  }, [meRole]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (roleFilter !== "SVE" && r.role !== roleFilter) return false;
      if (statusFilter !== "SVE" && r.statusNaloga !== statusFilter) return false;
      return true;
    });
  }, [rows, roleFilter, statusFilter]);

  async function toggleStatus(row: UserRow) {
    const next = row.statusNaloga === "AKTIVAN" ? "BLOKIRAN" : "AKTIVAN";
    setUpdatingId(row.korisnikId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${row.korisnikId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusNaloga: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Greska pri promeni statusa.");
        return;
      }
      setRows((prev) =>
        prev.map((u) =>
          u.korisnikId === row.korisnikId ? { ...u, statusNaloga: next } : u
        )
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">Korisnici</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pregled naloga i mogucnost suspendovanja.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Uloga:</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          >
            <option value="SVE">Sve</option>
            <option value="UCENIK">Ucenici</option>
            <option value="TUTOR">Tutori</option>
            <option value="ADMIN">Admini</option>
          </select>
          <span className="text-sm font-medium text-slate-700">Status:</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="SVE">Svi</option>
            <option value="AKTIVAN">Aktivan</option>
            <option value="BLOKIRAN">Blokiran</option>
          </select>
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-600">Ucitavam korisnike...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
              Trenutno nema korisnika za izabrane filtere.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid grid-cols-[1.4fr_1.6fr_0.8fr_0.8fr_0.8fr] bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                <span>Ime i prezime</span>
                <span>Email</span>
                <span>Uloga</span>
                <span>Status</span>
                <span className="text-right">Akcije</span>
              </div>
              {filtered.map((u, idx) => (
                <div
                  key={u.korisnikId}
                  className={`grid grid-cols-[1.4fr_1.6fr_0.8fr_0.8fr_0.8fr] items-center px-4 py-3 text-sm ${
                    idx === filtered.length - 1 ? "" : "border-b border-slate-100"
                  }`}
                >
                  <span className="font-medium text-slate-900">
                    {u.ime} {u.prezime}
                  </span>
                  <span className="text-slate-700">{u.email}</span>
                  <span className="text-slate-700">{u.role}</span>
                  <span className="text-slate-700">{u.statusNaloga}</span>
                  <div className="text-right">
                    {u.role === "ADMIN" ? (
                      <span className="text-xs text-slate-500">—</span>
                    ) : (
                      <Button
                        variant={u.statusNaloga === "AKTIVAN" ? "danger" : "secondary"}
                        size="sm"
                        disabled={updatingId === u.korisnikId}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.statusNaloga === "AKTIVAN" ? "Suspenduj" : "Aktiviraj"}
                      </Button>
                    )}
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
