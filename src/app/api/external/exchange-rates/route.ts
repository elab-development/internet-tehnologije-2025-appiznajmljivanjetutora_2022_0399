import { NextResponse } from "next/server";

type ExchangeApiResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") ?? "EUR").toUpperCase();
  const symbols = (searchParams.get("symbols") ?? "RSD").toUpperCase();

  const upstream = await fetch(
    `https://api.frankfurter.app/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols)}`,
    { cache: "no-store" }
  );

  if (!upstream.ok) {
    return NextResponse.json({ error: "Exchange API nije dostupan." }, { status: 502 });
  }

  const payload = (await upstream.json()) as ExchangeApiResponse;
  return NextResponse.json({ rate: payload }, { status: 200 });
}
