"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";

type User = {
  korisnikId: number;
  ime: string;
  prezime: string;
  email: string;
  statusNaloga: string;
  role: "UCENIK" | "TUTOR" | "ADMIN";
};

type TutorProfile = {
  biografija: string | null;
  cenaPoCasu: string;
  verifikovan: boolean;
};

type LanguageOption = {
  jezikId: number;
  naziv: string;
};

type TutorLanguage = {
  jezikId: number;
  naziv: string;
  nivo: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
};

type Termin = {
  terminId: number;
  tutorId: number;
  datum: string;
  vremeOd: string;
  vremeDo: string;
  status: "SLOBODAN" | "REZERVISAN" | "OTKAZAN";
};

type Rezervacija = {
  rezervacijaId: number;
  terminId: number;
  ucenikId: number;
  status: "AKTIVNA" | "OTKAZANA" | "ODRZANA";
};

type Bedz = {
  bedzId: number;
  naziv: string;
  opis: string | null;
  datumDodele: string;
};

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [tutorBio, setTutorBio] = useState("");
  const [tutorPrice, setTutorPrice] = useState("");
  const [tutorMsg, setTutorMsg] = useState<string | null>(null);
  const [tutorSaving, setTutorSaving] = useState(false);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [tutorLanguages, setTutorLanguages] = useState<TutorLanguage[]>([]);
  const [langId, setLangId] = useState("");
  const [langLevel, setLangLevel] = useState<TutorLanguage["nivo"]>("B1");
  const [langMsg, setLangMsg] = useState<string | null>(null);
  const [tutorStats, setTutorStats] = useState<{
    activeReservations: number;
    heldClasses: number;
    avgRating: string;
  } | null>(null);
  const [adminStats, setAdminStats] = useState<{
    totalTutors: number;
    verifiedTutors: number;
    activeReservations: number;
    pendingVerifications: number;
  } | null>(null);

  const [bedzevi, setBedzevi] = useState<Bedz[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      setUser(data?.user || null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.role === "TUTOR") {
      (async () => {
        const res = await fetch(`/api/tutors/${user.korisnikId}`);
        const data = await res.json();
        if (data?.tutor) {
          setTutorProfile(data.tutor);
          setTutorBio(data.tutor.biografija ?? "");
          setTutorPrice(data.tutor.cenaPoCasu ?? "");
        }
        if (Array.isArray(data?.languages)) {
          const mapped: TutorLanguage[] = data.languages.map(
            (l: { jezikId: number; naziv: string; nivo: TutorLanguage["nivo"] }) => ({
              jezikId: l.jezikId,
              naziv: l.naziv,
              nivo: l.nivo,
            })
          );
          setTutorLanguages(mapped);
        }
        try {
          const langRes = await fetch("/api/languages");
          const langData = await langRes.json();
          setLanguages(langData?.languages ?? []);
        } catch {
          setLanguages([]);
        }
        try {
          const tRes = await fetch(`/api/termini?tutorId=${user.korisnikId}`);
          const tData = await tRes.json();
          const termini: Termin[] = tData?.termini ?? [];
          const rez = await Promise.all(
            termini.map(async (t) => {
              const rRes = await fetch(`/api/rezervacije?terminId=${t.terminId}`);
              const rData = await rRes.json();
              return rData?.rezervacije ?? [];
            })
          );
          const flat: Rezervacija[] = rez.flat();
          const activeReservations = flat.filter((r) => r.status === "AKTIVNA").length;
          const heldClasses = flat.filter((r) => r.status === "ODRZANA").length;
          let avgRating = data?.tutor?.prosecnaOcena ?? "0.00";
          try {
            const revRes = await fetch(`/api/recenzije?tutorId=${user.korisnikId}`);
            const revData = await revRes.json();
            const list: Array<{ ocena: number }> = revData?.recenzije ?? [];
            if (list.length > 0) {
              const avg =
                list.reduce((sum, r) => sum + Number(r.ocena ?? 0), 0) / list.length;
              avgRating = avg.toFixed(2);
            }
          } catch {
            // fallback to stored avg
          }
          setTutorStats({ activeReservations, heldClasses, avgRating });
        } catch {
          setTutorStats({ activeReservations: 0, heldClasses: 0, avgRating: "0.00" });
        }
      })();
    }

    if (user.role === "ADMIN") {
      (async () => {
        try {
          const tutorsRes = await fetch("/api/tutors");
          const tutorsData = await tutorsRes.json();
          const tutors = tutorsData?.tutors ?? [];
          const totalTutors = tutors.length;
          const verifiedTutors = tutors.filter((t: { verifikovan: boolean }) => t.verifikovan)
            .length;

          const rezRes = await fetch("/api/rezervacije");
          const rezData = await rezRes.json();
          const rezervacije: Rezervacija[] = rezData?.rezervacije ?? [];
          const activeReservations = rezervacije.filter((r) => r.status === "AKTIVNA")
            .length;

          const verRes = await fetch("/api/verifikacije");
          const verData = await verRes.json();
          const zahtevi = verData?.zahtevi ?? [];
          const pendingVerifications = zahtevi.filter(
            (z: { status: string }) => z.status === "NOV"
          ).length;

          setAdminStats({
            totalTutors,
            verifiedTutors,
            activeReservations,
            pendingVerifications,
          });
        } catch {
          setAdminStats({
            totalTutors: 0,
            verifiedTutors: 0,
            activeReservations: 0,
            pendingVerifications: 0,
          });
        }
      })();
    }

    if (user.role === "UCENIK") {
      (async () => {
        const res = await fetch("/api/me/bedzevi");
        const data = await res.json();
        setBedzevi(data?.bedzevi ?? []);
      })();
    }
  }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function saveTutorProfile() {
    if (!user) return;
    setTutorMsg(null);
    setTutorSaving(true);
    try {
      const res = await fetch(`/api/tutors/${user.korisnikId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biografija: tutorBio.trim() || null,
          cenaPoCasu: tutorPrice.trim() || "0.00",
          languages: tutorLanguages.map((l) => ({
            jezikId: l.jezikId,
            nivo: l.nivo,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTutorMsg(data?.error || "Greška pri čuvanju.");
        return;
      }
      setTutorMsg("Profil sačuvan.");
    } finally {
      setTutorSaving(false);
    }
  }

  function addTutorLanguage() {
    setLangMsg(null);
    const id = Number(langId);
    if (!id) {
      setLangMsg("Izaberite jezik.");
      return;
    }
    const lang = languages.find((l) => l.jezikId === id);
    if (!lang) {
      setLangMsg("Neispravan jezik.");
      return;
    }
    setTutorLanguages((prev) => {
      const existing = prev.find((p) => p.jezikId === id);
      if (existing) {
        return prev.map((p) => (p.jezikId === id ? { ...p, nivo: langLevel } : p));
      }
      return [...prev, { jezikId: id, naziv: lang.naziv, nivo: langLevel }];
    });
    setLangId("");
  }

  function removeTutorLanguage(id: number) {
    setTutorLanguages((prev) => prev.filter((l) => l.jezikId !== id));
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
      <div
        className={
          user.role === "UCENIK"
            ? "mx-auto grid max-w-5xl gap-6 lg:grid-cols-[2fr_1fr]"
            : user.role === "TUTOR"
              ? "mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]"
              : "mx-auto max-w-5xl"
        }
      >
        <div
          className={
            user.role === "TUTOR" ? "grid w-full max-w-2xl gap-6 lg:justify-self-center" : ""
          }
        >
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
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
            {user.role === "TUTOR" && tutorProfile && (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <span className="font-medium text-slate-600">Verifikacija</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    tutorProfile.verifikovan
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {tutorProfile.verifikovan ? "Verifikovan" : "Na čekanju"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={logout} variant="danger">
              Logout
            </Button>
          </div>
        </div>
        </div>

        {user.role === "UCENIK" && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-slate-900">Bedževi</h2>
            <p className="mt-1 text-sm text-slate-600">
              Bedževi koje ste osvojili u sistemu.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {bedzevi.length === 0 ? (
                <div className="w-full rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
                  Još uvek nema bedževa.
                </div>
              ) : (
                bedzevi.map((b) => (
                  <div
                    key={b.bedzId}
                    className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base text-blue-700 shadow-sm">
                      🏅
                    </span>
                    <span>{b.naziv}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {user.role === "TUTOR" && (
          <div className="self-start rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-slate-900">Moj dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">Brzi pregled aktivnosti.</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">Aktivne rezervacije</div>
                <div className="text-xl font-semibold text-slate-900">
                  {tutorStats?.activeReservations ?? 0}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">Održani časovi</div>
                <div className="text-xl font-semibold text-slate-900">
                  {tutorStats?.heldClasses ?? 0}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">Prosečna ocena</div>
                <div className="text-xl font-semibold text-slate-900">
                  {tutorStats?.avgRating ?? "0.00"}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {user.role === "TUTOR" && (
        <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900">Uredi tutor profil</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ažuriraj biografiju i cenu po času.
          </p>

          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Biografija
              <textarea
                className="min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
                placeholder="Napiši kratku biografiju..."
                value={tutorBio}
                onChange={(e) => setTutorBio(e.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Cena po času
              <Input
                placeholder="npr 1200.00"
                value={tutorPrice}
                onChange={(e) => setTutorPrice(e.target.value)}
              />
            </label>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">Jezici i nivoi</h3>
            <p className="mt-1 text-xs text-slate-600">
              Dodaj jezike koje predaješ i nivo znanja.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_140px_auto]">
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={langId}
                onChange={(e) => setLangId(e.target.value)}
              >
                <option value="">Izaberi jezik...</option>
                {languages.map((l) => (
                  <option key={l.jezikId} value={String(l.jezikId)}>
                    {l.naziv}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={langLevel}
                onChange={(e) => setLangLevel(e.target.value as TutorLanguage["nivo"])}
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
              <Button variant="secondary" onClick={addTutorLanguage}>
                Dodaj
              </Button>
            </div>
            {langMsg && <p className="mt-2 text-sm text-red-600">{langMsg}</p>}
            {tutorLanguages.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Još nema unetih jezika.
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {tutorLanguages.map((l) => (
                  <span
                    key={`${l.jezikId}-${l.nivo}`}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900"
                  >
                    {l.naziv} • {l.nivo}
                    <button
                      type="button"
                      className="text-blue-700 hover:text-blue-900"
                      onClick={() => removeTutorLanguage(l.jezikId)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={saveTutorProfile} disabled={tutorSaving} variant="primary">
              {tutorSaving ? "Čuvam..." : "Sačuvaj izmene"}
            </Button>
          </div>

          {tutorMsg && <p className="mt-3 text-sm text-slate-700">{tutorMsg}</p>}
        </div>
      )}



      {user.role === "ADMIN" && (
        <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900">Admin dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pregled osnovnih metrika sistema.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-semibold text-slate-500">Ukupno tutora</div>
              <div className="text-xl font-semibold text-slate-900">
                {adminStats?.totalTutors ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-semibold text-slate-500">Verifikovani tutori</div>
              <div className="text-xl font-semibold text-slate-900">
                {adminStats?.verifiedTutors ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-semibold text-slate-500">Aktivne rezervacije</div>
              <div className="text-xl font-semibold text-slate-900">
                {adminStats?.activeReservations ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-semibold text-slate-500">Novi zahtevi za verifikaciju</div>
              <div className="text-xl font-semibold text-slate-900">
                {adminStats?.pendingVerifications ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
