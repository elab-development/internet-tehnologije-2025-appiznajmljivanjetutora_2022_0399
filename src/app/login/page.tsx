"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/me";

  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lozinka }),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { error: await res.text() };
      if (!res.ok) {
        setError(data?.error || "Nešto nije okej ... pokušaj ponovo");
        return;
      }

      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Login</h1>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            Uloguj se
          </span>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
              placeholder="email@primer.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Lozinka
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
              placeholder="Unesi lozinku"
              type="password"
              value={lozinka}
              onChange={(e) => setLozinka(e.target.value)}
            />
          </label>
          <button
            disabled={loading}
            type="submit"
            className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Ulazim..." : "Uloguj se"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <p className="mt-6 text-sm text-slate-600">
          Nemaš nalog?{" "}
          <a className="font-semibold text-blue-700 hover:text-blue-800" href="/register">
            Registruj se
          </a>
        </p>
      </div>
    </main>
  );
}
