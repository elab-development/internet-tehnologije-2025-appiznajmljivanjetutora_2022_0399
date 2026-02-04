"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (data?.user) router.replace("/me");
      else router.replace("/login");
    })();
  }, [router]);

  return <main style={{ padding: 24 }}>Preusmeravam...</main>;
}
