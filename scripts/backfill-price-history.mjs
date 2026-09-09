import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; PatrimonioApp/1.0)" };

const FUND_TICKERS = {
  IE000ZYRH0Q7: { ticker: "0P0001XF40.F", currency: "EUR" },
  IE000QAZP7L2: { ticker: "0P0001XF3Z.F", currency: "EUR" },
  IE00BF4RFH31: { ticker: "IUSN.DE", currency: "EUR" },
  IE00B18GC888: { ticker: "0P00012I69.F", currency: "EUR" },
  IE00B579F325: { ticker: "SGLD.L", currency: "USD" },
};

async function getUsdToEurRate() {
  const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR");
  const data = await res.json();
  return data.rates.EUR;
}

async function getYahooHistory(ticker, range = "2y") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=1d`;
  const res = await fetch(url, { headers: HEADERS });
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`Sin datos para ${ticker}: ${JSON.stringify(data?.chart?.error)}`);
  const timestamps = result.timestamp || [];
  const closes = result.indicators.quote[0].close || [];
  const out = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] == null) continue;
    out.push({ date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10), price: closes[i] });
  }
  return out;
}

async function main() {
  const usdToEur = await getUsdToEurRate();
  console.log("Tipo de cambio USD->EUR:", usdToEur);

  for (const [isin, info] of Object.entries(FUND_TICKERS)) {
    console.log(`\n=== ${isin} (${info.ticker}) ===`);
    const history = await getYahooHistory(info.ticker, "2y");
    console.log(`  ${history.length} puntos diarios obtenidos`);

    let inserted = 0;
    for (const point of history) {
      const priceEur = info.currency === "USD" ? point.price * usdToEur : point.price;
      await sql`
        INSERT INTO price_history (isin, date, price_eur)
        VALUES (${isin}, ${point.date}, ${priceEur})
        ON CONFLICT (isin, date) DO UPDATE SET price_eur = EXCLUDED.price_eur
      `;
      inserted++;
    }
    console.log(`  ✓ ${inserted} filas guardadas/actualizadas en price_history`);
  }

  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM price_history`;
  console.log(`\n✅ Total en price_history: ${n} filas`);
}

main().catch((e) => {
  console.error("❌ ERROR:", e);
  process.exit(1);
});
