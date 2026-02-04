"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (data?.user) router.replace("/me");
      else router.replace("/login");
    })();
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-10">
      <div className="pointer-events-none absolute -right-20 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dobrodošli nazad
        </h1>
        <p className="mt-2 text-slate-600">
          Proveravam vaš nalog i preusmeravam vas na odgovarajuću stranicu.
        </p>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
        </div>
      </div>
    </main>
  );
}
