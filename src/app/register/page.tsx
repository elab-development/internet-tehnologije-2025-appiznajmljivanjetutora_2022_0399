"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "UCENIK" | "TUTOR";

export default function RegisterPage() {
  const router = useRouter();

  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [role, setRole] = useState<Role>("UCENIK");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ime, prezime, email, lozinka, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Nešto nije okej...");
        return;
      }

      router.push("/me");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Registracija</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input placeholder="Ime" value={ime} onChange={(e) => setIme(e.target.value)} />
        <input placeholder="Prezime" value={prezime} onChange={(e) => setPrezime(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder="Lozinka"
          type="password"
          value={lozinka}
          onChange={(e) => setLozinka(e.target.value)}
        />

        <label>
          Uloga:
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="UCENIK">Učenik</option>
            <option value="TUTOR">Tutor</option>
          </select>
        </label>

        <button disabled={loading} type="submit">
          {loading ? "Kreiram..." : "Napravi nalog"}
        </button>
      </form>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      <p style={{ marginTop: 16 }}>
        Imaš nalog? <a href="/login">Uloguj se</a>
      </p>
    </main>
  );
}
