import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=RSD&to=EUR,USD",
      { next: { revalidate: 60 * 60 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Greska pri preuzimanju kursa." }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(
      {
        base: data.base,
        date: data.date,
        rates: data.rates ?? {},
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Exchange API nije dostupan." }, { status: 502 });
  }
}
