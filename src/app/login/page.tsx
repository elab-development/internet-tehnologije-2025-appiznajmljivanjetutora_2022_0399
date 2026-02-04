"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/me";

  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lozinka }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Nešto nije okej ... pokušaj ponovo");
        return;
      }

      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Lozinka"
          type="password"
          value={lozinka}
          onChange={(e) => setLozinka(e.target.value)}
        />
        <button disabled={loading} type="submit">
          {loading ? "Ulazim..." : "Uloguj se"}
        </button>
      </form>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      <p style={{ marginTop: 16 }}>
        Nemaš nalog? <a href="/register">Registruj se</a>
      </p>
    </main>
  );
}
