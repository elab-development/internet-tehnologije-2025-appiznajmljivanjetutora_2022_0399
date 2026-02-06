"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

type MeUser = { korisnikId: number; role: "UCENIK" | "TUTOR" | "ADMIN" };
type TutorProfile = { verifikovan: boolean };

type HistoryItem = {
  zahtevId: number;
  status: string;
  datumPodnosenja: string;
  datumOdluke: string | null;
  dokumentUrl: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const raw = value.split("T")[0] ?? "";
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return value;
  return `${d}.${m}.${y}`;
}

export default function VerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [verifStatus, setVerifStatus] = useState<string | null>(null);
  const [verifDocUrl, setVerifDocUrl] = useState<string>("");
  const [verifFile, setVerifFile] = useState<File | null>(null);
  const [verifMsg, setVerifMsg] = useState<string | null>(null);
  const [verifUploading, setVerifUploading] = useState(false);
  const [verifSubmitting, setVerifSubmitting] = useState(false);
  const [verifHistory, setVerifHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (!data?.user) {
        router.replace("/login");
        return;
      }
      if (data.user.role !== "TUTOR") {
        router.replace("/me");
        return;
      }
      setUser({ korisnikId: data.user.korisnikId, role: data.user.role });
    })();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const profileRes = await fetch(`/api/tutors/${user.korisnikId}`);
      const profileData = await profileRes.json();
      if (profileData?.tutor) {
        setTutorProfile({ verifikovan: profileData.tutor.verifikovan });
      }

      const vRes = await fetch("/api/verifikacije/moj");
      const vData = await vRes.json();
      if (vData?.zahtev) {
        setVerifStatus(vData.zahtev.status);
        setVerifDocUrl(vData.zahtev.dokumentUrl ?? "");
      } else {
        setVerifStatus(null);
        setVerifDocUrl("");
      }

      const hRes = await fetch("/api/verifikacije/istorija");
      const hData = await hRes.json();
      setVerifHistory(hData?.zahtevi ?? []);
    })();
  }, [user]);

  async function uploadVerificationFile() {
    setVerifMsg(null);
    if (!verifFile) {
      setVerifMsg("Izaberite dokument ili sliku.");
      return;
    }
    setVerifUploading(true);
    try {
      const form = new FormData();
      form.append("file", verifFile);
      const res = await fetch("/api/verifikacije/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifMsg(data?.error || "Greška pri uploadu.");
        return;
      }
      setVerifDocUrl(data.url);
      setVerifMsg("Dokument uspešno uploadovan.");
    } finally {
      setVerifUploading(false);
    }
  }

  async function submitVerification() {
    setVerifMsg(null);
    if (!verifDocUrl) {
      setVerifMsg("Dokument URL je obavezan.");
      return;
    }
    setVerifSubmitting(true);
    try {
      const res = await fetch("/api/verifikacije", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dokumentUrl: verifDocUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifMsg(data?.error || "Greška pri slanju zahteva.");
        return;
      }
      setVerifStatus("NOV");
      setVerifMsg("Zahtev je poslat.");
      const hRes = await fetch("/api/verifikacije/istorija");
      const hData = await hRes.json();
      setVerifHistory(hData?.zahtevi ?? []);
    } finally {
      setVerifSubmitting(false);
    }
  }

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
        <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-slate-700">Učitavam...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-sky-50 px-6 py-12">
      <div className="pointer-events-none absolute -right-24 top-[-120px] h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-140px] h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">Verifikacija</h1>
        <p className="mt-2 text-sm text-slate-600">
          Trenutni status: <b>{verifStatus ?? "Nema zahteva"}</b>
        </p>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Dokument (PDF/JPG/PNG)
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={(e) => setVerifFile(e.target.files?.[0] ?? null)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={uploadVerificationFile}
              disabled={verifUploading || verifStatus === "NOV" || tutorProfile?.verifikovan}
            >
              {verifUploading ? "Upload..." : "Upload dokument"}
            </Button>
            <Button
              variant="primary"
              onClick={submitVerification}
              disabled={
                verifSubmitting || !verifDocUrl || verifStatus === "NOV" || tutorProfile?.verifikovan
              }
            >
              {verifSubmitting ? "Šaljem..." : "Podnesi zahtev"}
            </Button>
          </div>

          {tutorProfile?.verifikovan && (
            <p className="text-sm text-slate-600">
              Već ste verifikovani. Nije moguće podnositi nove zahteve.
            </p>
          )}
          {verifStatus === "NOV" && (
            <p className="text-sm text-slate-600">
              Zahtev je već podnet. Nije moguće poslati novi dok se ne donese odluka.
            </p>
          )}

          {verifDocUrl && (
            <p className="text-xs text-slate-600">
              Dokument:{" "}
              <a
                className="text-blue-700 hover:text-blue-800"
                href={verifDocUrl}
                target="_blank"
                rel="noreferrer"
              >
                Pogledaj
              </a>
            </p>
          )}
          {verifMsg && <p className="text-sm text-slate-700">{verifMsg}</p>}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900">Istorija zahteva</h3>
          {verifHistory.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Nema prethodnih zahteva.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {verifHistory.map((h) => (
                <div
                  key={h.zahtevId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <span className="text-slate-700">
                    Podnet: {formatDate(h.datumPodnosenja)} • Odluka:{" "}
                    {formatDate(h.datumOdluke)}
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
