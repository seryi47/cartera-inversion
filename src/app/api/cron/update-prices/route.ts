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
  // un único instante para TODO el lote — si cada fondo guardara su propio
  // now(), durante los primeros milisegundos habría fondos "sin precio
  // todavía" y la gráfica intradía mostraría un valor de cartera incompleto
  // (solo el fondo que ya tenía fila) antes de completarse una fracción de
  // segundo después, con pinta de bajón/subida que nunca existió de verdad
  const runTs = new Date().toISOString();
  const results: Record<string, string> = {};

  const isins = Object.keys(FUND_TICKERS);
  const prices = await Promise.allSettled(isins.map((isin) => getFundPriceEur(isin)));

  for (let i = 0; i < isins.length; i++) {
    const isin = isins[i];
    const result = prices[i];
    if (result.status === "rejected") {
      results[isin] = `error: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`;
      continue;
    }
    const price = result.value;
    try {
      await sql`
        INSERT INTO price_history (isin, date, price_eur)
        VALUES (${isin}, ${today}, ${price})
        ON CONFLICT (isin, date) DO UPDATE SET price_eur = EXCLUDED.price_eur
      `;
      await sql`INSERT INTO price_snapshots (isin, ts, price_eur) VALUES (${isin}, ${runTs}, ${price})`;
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
