"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  korisnikId: number;
  ime: string;
  prezime: string;
  email: string;
  statusNaloga: string;
  role: "UCENIK" | "TUTOR" | "ADMIN";
};

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      setUser(data?.user || null);
    })();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
        <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-slate-700">Učitavam profil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Moj nalog
            </h1>
            <p className="mt-2 text-slate-600">
              {user.ime} {user.prezime}
            </p>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            {user.role}
          </span>
        </div>

        <div className="mt-6 grid gap-2 text-sm text-slate-700">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-medium text-slate-600">Email</span>
            <span className="text-slate-900">{user.email}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-medium text-slate-600">Status</span>
            <span className="text-slate-900">{user.statusNaloga}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {user.role === "UCENIK" && (
            <a
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
              href="/tutors"
            >
              Pretraga tutora
            </a>
          )}
          <button
            onClick={logout}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
