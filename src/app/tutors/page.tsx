"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type User = { role: "UCENIK" | "TUTOR" | "ADMIN" };
type Language = { jezikId: number; naziv: string };

type Tutor = {
  tutorId: number;
  ime: string;
  prezime: string;
  cenaPoCasu: string;
  verifikovan: boolean;
  prosecnaOcena: string;
  biografija: string | null;
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export default function TutorsPage() {
  const router = useRouter();

  const [me, setMe] = useState<User | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);

  const [languageId, setLanguageId] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [verified, setVerified] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (!data?.user) {
        router.replace("/login");
        return;
      }
      if (data.user.role !== "UCENIK") {
        router.replace("/me");
        return;
      }

      setMe({ role: data.user.role });

      const langRes = await fetch("/api/languages");
      const langData = await langRes.json();
      setLanguages(langData.languages || []);
    })();
  }, [router]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (verified) p.set("verified", "true");
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (languageId) p.set("languageId", languageId);
    if (level) p.set("level", level);
    return p.toString();
  }, [verified, maxPrice, languageId, level]);

  useEffect(() => {
    if (!me) return;

    (async () => {
      const res = await fetch(`/api/tutors${query ? `?${query}` : ""}`);
      const data = await res.json();
      setTutors(data.tutors || []);
    })();
  }, [me, query]);

  if (!me) return <main style={{ padding: 24 }}>Učitavam...</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Pretraga tutora</h1>

      <div style={{ display: "grid", gap: 10, maxWidth: 420, marginTop: 16 }}>
        <label>
          Jezik:
          <select value={languageId} onChange={(e) => setLanguageId(e.target.value)}>
            <option value="">(svi)</option>
            {languages.map((l) => (
              <option key={l.jezikId} value={String(l.jezikId)}>
                {l.naziv}
              </option>
            ))}
          </select>
        </label>

        <label>
          Nivo:
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">(svi)</option>
            {LEVELS.map((lv) => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </select>
        </label>

        <label>
          Max cena:
          <input
            placeholder="npr 1200"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />
          Samo verifikovani
        </label>

        <a href="/me">Nazad na moj nalog</a>
      </div>

      <h2 style={{ marginTop: 24 }}>Rezultati</h2>
      {tutors.length === 0 ? (
        <p>Nema tutora za izabrane filtere.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {tutors.map((t) => (
            <div key={t.tutorId} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <b>{t.ime} {t.prezime}</b>{" "}
              {t.verifikovan ? "✅" : "⏳"}
              <div>Cena: {t.cenaPoCasu}</div>
              <div>Ocena: {t.prosecnaOcena}</div>
              {t.biografija && <div style={{ marginTop: 8 }}>{t.biografija}</div>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
