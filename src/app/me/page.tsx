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

type TutorProfile = {
  biografija: string | null;
  cenaPoCasu: string;
  verifikovan: boolean;
};

type Language = {
  jezikId: number;
  naziv: string;
};

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [tutorBio, setTutorBio] = useState("");
  const [tutorPrice, setTutorPrice] = useState("");
  const [tutorMsg, setTutorMsg] = useState<string | null>(null);
  const [tutorSaving, setTutorSaving] = useState(false);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [newLanguage, setNewLanguage] = useState("");
  const [langMsg, setLangMsg] = useState<string | null>(null);
  const [langSaving, setLangSaving] = useState(false);
  const [editLangId, setEditLangId] = useState<number | null>(null);
  const [editLangName, setEditLangName] = useState("");

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
      })();
    }

    if (user.role === "ADMIN") {
      (async () => {
        const res = await fetch("/api/languages");
        const data = await res.json();
        setLanguages(data?.languages ?? []);
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

  async function addLanguage() {
    setLangMsg(null);
    if (!newLanguage.trim()) {
      setLangMsg("Naziv jezika je obavezan.");
      return;
    }
    setLangSaving(true);
    try {
      const res = await fetch("/api/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naziv: newLanguage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLangMsg(data?.error || "Greška pri dodavanju jezika.");
        return;
      }
      const refresh = await fetch("/api/languages");
      const fresh = await refresh.json();
      setLanguages(fresh?.languages ?? []);
      setNewLanguage("");
      setLangMsg("Jezik dodat.");
    } finally {
      setLangSaving(false);
    }
  }

  async function updateLanguage(id: number) {
    setLangMsg(null);
    if (!editLangName.trim()) {
      setLangMsg("Naziv jezika je obavezan.");
      return;
    }
    setLangSaving(true);
    try {
      const res = await fetch(`/api/languages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naziv: editLangName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLangMsg(data?.error || "Greška pri izmeni jezika.");
        return;
      }
      const refresh = await fetch("/api/languages");
      const fresh = await refresh.json();
      setLanguages(fresh?.languages ?? []);
      setEditLangId(null);
      setEditLangName("");
      setLangMsg("Jezik izmenjen.");
    } finally {
      setLangSaving(false);
    }
  }

  async function deleteLanguage(id: number) {
    setLangMsg(null);
    setLangSaving(true);
    try {
      const res = await fetch(`/api/languages/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setLangMsg(data?.error || "Greška pri brisanju jezika.");
        return;
      }
      setLanguages((prev) => prev.filter((l) => l.jezikId !== id));
      setLangMsg("Jezik obrisan.");
    } finally {
      setLangSaving(false);
    }
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

      {user.role === "TUTOR" && (
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
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
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
                placeholder="npr 1200.00"
                value={tutorPrice}
                onChange={(e) => setTutorPrice(e.target.value)}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={saveTutorProfile}
              disabled={tutorSaving}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tutorSaving ? "Čuvam..." : "Sačuvaj izmene"}
            </button>
            {tutorProfile && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tutorProfile.verifikovan
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {tutorProfile.verifikovan ? "Verifikovan" : "Na čekanju"}
              </span>
            )}
          </div>

          {tutorMsg && <p className="mt-3 text-sm text-slate-700">{tutorMsg}</p>}
        </div>
      )}

      {user.role === "ADMIN" && (
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900">Upravljanje jezicima</h2>
          <p className="mt-1 text-sm text-slate-600">
            Dodaj, izmeni ili obriši jezike koji se koriste u sistemu.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
              placeholder="Novi jezik (npr. Holandski)"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
            />
            <button
              onClick={addLanguage}
              disabled={langSaving}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Dodaj
            </button>
          </div>

          {langMsg && <p className="mt-3 text-sm text-slate-700">{langMsg}</p>}

          <div className="mt-6 grid gap-3">
            {languages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Nema jezika u bazi.
              </div>
            ) : (
              languages.map((lang) => (
                <div
                  key={lang.jezikId}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  {editLangId === lang.jezikId ? (
                    <>
                      <input
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
                        value={editLangName}
                        onChange={(e) => setEditLangName(e.target.value)}
                      />
                      <button
                        onClick={() => updateLanguage(lang.jezikId)}
                        disabled={langSaving}
                        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                      >
                        Sačuvaj
                      </button>
                      <button
                        onClick={() => {
                          setEditLangId(null);
                          setEditLangName("");
                        }}
                        className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                      >
                        Otkaži
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-slate-800">
                        {lang.naziv}
                      </span>
                      <button
                        onClick={() => {
                          setEditLangId(lang.jezikId);
                          setEditLangName(lang.naziv);
                        }}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        Izmeni
                      </button>
                      <button
                        onClick={() => deleteLanguage(lang.jezikId)}
                        disabled={langSaving}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                      >
                        Obriši
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}
