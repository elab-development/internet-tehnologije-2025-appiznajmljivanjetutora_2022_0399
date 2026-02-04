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

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      setUser(data?.user || null);
    })();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!user) return <main style={{ padding: 24 }}>Učitavam profil...</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Moj nalog</h1>
      <p>
        {user.ime} {user.prezime} — <b>{user.role}</b>
      </p>
      <p>{user.email}</p>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        {user.role === "UCENIK" && <a href="/tutors">Pretraga tutora</a>}
        {/* kasnije: tutor -> /terms, admin -> /complaints */}
        <button onClick={logout}>Logout</button>
      </div>
    </main>
  );
}
