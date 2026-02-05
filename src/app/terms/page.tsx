"use client";

import Button from "@/components/Button";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">
          Uredi slobodne termine
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ova stranica je placeholder za upravljanje slobodnim terminima tutora.
        </p>

        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          U narednoj iteraciji ovde će biti kalendar i lista termina.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => router.push("/me")}>
            Nazad na moj nalog
          </Button>
          <Button variant="primary">Dodaj termin</Button>
        </div>
      </div>
    </main>
  );
}
