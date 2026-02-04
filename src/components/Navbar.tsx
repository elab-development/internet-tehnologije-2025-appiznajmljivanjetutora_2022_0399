import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-blue-900">
          TutorHub
        </Link>

        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
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
        </nav>
      </div>
    </header>
  );
}
