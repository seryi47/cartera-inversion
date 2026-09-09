import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { FUND_TICKERS } from "@/lib/fund-tickers";
import { getFundPriceEur } from "@/lib/fund-price";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const results: Record<string, string> = {};

  for (const isin of Object.keys(FUND_TICKERS)) {
    try {
      const price = await getFundPriceEur(isin);
      await sql`
        INSERT INTO price_history (isin, date, price_eur)
        VALUES (${isin}, ${today}, ${price})
        ON CONFLICT (isin, date) DO UPDATE SET price_eur = EXCLUDED.price_eur
      `;
      await sql`INSERT INTO price_snapshots (isin, price_eur) VALUES (${isin}, ${price})`;
      results[isin] = `ok: ${price.toFixed(4)} EUR`;
    } catch (e) {
      results[isin] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  // los snapshots de hace más de 30 días ya no aportan (el histórico diario
  // los cubre de sobra) — los podamos aquí mismo para no crecer sin límite
  await sql`DELETE FROM price_snapshots WHERE ts < now() - interval '30 days'`;

  return NextResponse.json({ date: today, results });
}
