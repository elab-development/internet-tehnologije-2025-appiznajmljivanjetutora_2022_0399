 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type MeUser = { role: "UCENIK" | "TUTOR" | "ADMIN" };

export default function Navbar() {
  const [user, setUser] = useState<MeUser | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      }
    })();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className={`text-lg font-semibold text-blue-900 ${
            pathname === "/login" || pathname === "/register" ? "mx-auto" : ""
          }`}
        >
          TutorApp
        </Link>

        {pathname !== "/login" && pathname !== "/register" && (
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
          {user?.role === "TUTOR" ? (
            <>
              <Link
                href="/terms"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Uredi slobodne termine
              </Link>
              <Link
                href="/my-bookings"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Moje rezervacije
              </Link>
              <Link
                href="/my-reviews"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Moje recenzije
              </Link>
              <Link
                href="/verification"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Verifikacija
              </Link>
              <Link
                href="/me"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Moj nalog
              </Link>
            </>
          ) : user?.role === "ADMIN" ? (
            <>
              <span
                className="cursor-not-allowed rounded-full bg-slate-100 px-3 py-1 text-slate-500"
                aria-disabled="true"
                title="Biće dostupno uskoro"
              >
                Pregled žalbi
              </span>
              <Link
                href="/admin-reviews"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Moderacija recenzija
              </Link>
              <Link
                href="/verifications"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Pregled zahteva za verifikaciju
              </Link>
              <Link
                href="/admin-users"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Upravljanje korisnicima
              </Link>
              <Link
                href="/me"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Moj nalog
              </Link>
            </>
          ) : (
            <>
              {user?.role === "UCENIK" && (
                <Link
                  href="/tutors"
                  className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
                >
                  Pretraga tutora
                </Link>
              )}
              {user?.role === "UCENIK" && (
                <Link
                  href="/my-bookings"
                  className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
                >
                  Moje rezervacije
                </Link>
              )}
              {user?.role === "UCENIK" && (
                <Link
                  href="/favorites"
                  className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
                >
                  Moji favoriti
                </Link>
              )}
              <Link
                href="/me"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Moj nalog
              </Link>
              {!user && (
                <>
                  <Link
                    href="/login"
                    className="rounded-full bg-green-600 px-3 py-1 text-white transition hover:bg-green-700"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-blue-900 px-3 py-1 text-white transition hover:bg-blue-800"
                  >
                    Registracija
                  </Link>
                </>
              )}
            </>
          )}
          </nav>
        )}
      </div>
    </header>
  );
}
