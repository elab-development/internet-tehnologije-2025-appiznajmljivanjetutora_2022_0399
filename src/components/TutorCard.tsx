type Props = {
  ime: string;
  prezime: string;
  cenaPoCasu: string;
  verifikovan: boolean;
  prosecnaOcena: string;
  biografija?: string | null;
};

export default function TutorCard({
  ime,
  prezime,
  cenaPoCasu,
  verifikovan,
  prosecnaOcena,
  biografija,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
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
        <div>Ocena: {prosecnaOcena}</div>
      </div>
      {biografija && <p className="mt-3 text-sm text-slate-600">{biografija}</p>}
    </div>
  );
}
