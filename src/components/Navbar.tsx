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
        const res = await fetch("/api/me");
        const data = await res.json();
        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      }
    })();
  }, []);

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
            </>
          ) : (
            <>
              <Link
                href="/tutors"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 transition hover:bg-blue-100"
              >
                Tutori
              </Link>
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
