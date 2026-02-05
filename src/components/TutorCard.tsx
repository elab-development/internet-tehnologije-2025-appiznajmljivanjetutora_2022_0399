import Link from "next/link";

type Props = {
  ime: string;
  prezime: string;
  cenaPoCasu: string;
  verifikovan: boolean;
  prosecnaOcena: string;
  biografija?: string | null;
  href?: string;
};

export default function TutorCard({
  ime,
  prezime,
  cenaPoCasu,
  verifikovan,
  prosecnaOcena,
  biografija,
  href,
}: Props) {
  const ocenaLabel =
    prosecnaOcena === "0.00" || prosecnaOcena === "0" || prosecnaOcena === "0.0"
      ? "Nema ocena"
      : prosecnaOcena;

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <b className="text-base text-slate-900">
          {ime} {prezime}
        </b>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            verifikovan ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {verifikovan ? "Verifikovan" : "Na čekanju"}
        </span>
      </div>
      <div className="mt-3 text-sm text-slate-700">
        <div>Cena: {cenaPoCasu}</div>
        <div>Ocena: {ocenaLabel}</div>
      </div>
      {biografija && <p className="mt-3 text-sm text-slate-600">{biografija}</p>}
    </>
  );

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-base font-semibold text-red-500 shadow-sm transition hover:bg-red-50"
        aria-label="Dodaj u favorite"
        title="Dodaj u favorite"
      >
        ♡
      </button>
      {href ? (
        <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-blue-200">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
