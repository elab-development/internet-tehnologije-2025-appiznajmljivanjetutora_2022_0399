"use client";

import Button from "@/components/Button";
import { useRouter } from "next/navigation";

export default function MyReviewsPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">Moje recenzije</h1>
        <p className="mt-2 text-sm text-slate-600">
          Placeholder za prikaz recenzija koje ste dobili ili ostavili.
        </p>

        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          Ovde će biti lista recenzija sa ocenama i komentarima.
        </div>

        <div className="mt-6">
          <Button variant="secondary" onClick={() => router.push("/me")}>
            Nazad na moj nalog
          </Button>
        </div>
      </div>
    </main>
  );
}
