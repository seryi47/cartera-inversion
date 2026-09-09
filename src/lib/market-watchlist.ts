import { load as loadYaml } from "js-yaml";
import { getYahooPrice } from "@/lib/yahoo";
import { getCoinGeckoPrices } from "@/lib/coingecko";
import { getUsdToEurRate } from "@/lib/fx";
import { FUND_TICKERS } from "@/lib/fund-tickers";

// Tickers de Yahoo que ya vienen en EUR (los fondos de MyInvestor) — todo lo
// demás en "stock" se asume en USD (acciones normales de EEUU + el ETC de oro
// SGLD.L, que curiosamente también cotiza en USD pese a estar en Londres).
const EUR_NATIVE_TICKERS = new Set(Object.values(FUND_TICKERS).filter((f) => f.currency === "EUR").map((f) => f.ticker));

const WATCHES_URL = "https://raw.githubusercontent.com/seryi47/BotTrading/master/watches.yaml";

type WatchAsset = {
  symbol: string;
  kind: "crypto" | "stock";
  source_id: string;
  name: string;
  dca?: boolean;
};

export type MarketRow = {
  symbol: string;
  name: string;
  kind: "crypto" | "stock";
  dca: boolean;
  priceUsd: number | null;
  priceEur: number | null;
  change24h: number | null;
  error: string | null;
};

export async function getMarketOverview(): Promise<MarketRow[]> {
  const res = await fetch(WATCHES_URL, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`No pude leer la watchlist de BotTrading (${res.status})`);
  const raw = loadYaml(await res.text()) as { assets: WatchAsset[] };
  const assets = raw.assets || [];

  const usdToEur = await getUsdToEurRate();
  const cryptoAssets = assets.filter((a) => a.kind === "crypto");
  const stockAssets = assets.filter((a) => a.kind === "stock");

  const cryptoPrices = await getCoinGeckoPrices(cryptoAssets.map((a) => a.source_id)).catch(
    () => ({}) as Record<string, { usd: number; usd_24h_change?: number }>
  );

  const stockResults = await Promise.allSettled(
    stockAssets.map((a) => getYahooPrice(a.source_id))
  );

  const rows: MarketRow[] = [];

  for (const a of cryptoAssets) {
    const p = cryptoPrices[a.source_id];
    rows.push({
      symbol: a.symbol,
      name: a.name,
      kind: "crypto",
      dca: !!a.dca,
      priceUsd: p ? p.usd : null,
      priceEur: p ? p.usd * usdToEur : null,
      change24h: p?.usd_24h_change ?? null,
      error: p ? null : "sin datos",
    });
  }

  stockAssets.forEach((a, i) => {
    const result = stockResults[i];
    if (result.status === "fulfilled") {
      const isEurNative = EUR_NATIVE_TICKERS.has(a.source_id);
      rows.push({
        symbol: a.symbol,
        name: a.name,
        kind: "stock",
        dca: !!a.dca,
        priceUsd: isEurNative ? result.value / usdToEur : result.value,
        priceEur: isEurNative ? result.value : result.value * usdToEur,
        change24h: null,
        error: null,
      });
    } else {
      rows.push({
        symbol: a.symbol,
        name: a.name,
        kind: "stock",
        dca: !!a.dca,
        priceUsd: null,
        priceEur: null,
        change24h: null,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });

  return rows;
}
