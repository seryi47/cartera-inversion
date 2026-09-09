const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; PatrimonioApp/1.0)" };

type YahooChartResult = {
  meta: { regularMarketPrice?: number; currency?: string };
  timestamp?: number[];
  indicators: { quote: [{ close: (number | null)[] }] };
};

async function fetchChart(ticker: string, range: string, interval = "1d") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status} para ${ticker}`);
  const data = await res.json();
  const result: YahooChartResult | undefined = data?.chart?.result?.[0];
  if (!result) throw new Error(`Sin datos de Yahoo Finance para ${ticker}`);
  return result;
}

export async function getYahooPrice(ticker: string): Promise<number> {
  const result = await fetchChart(ticker, "5d");
  const price = result.meta.regularMarketPrice;
  if (price != null) return price;
  // si el precio "en vivo" no viene (frecuente en fondos con NAV de un día de
  // retraso), usamos el último cierre no-nulo de la serie
  const closes = (result.indicators.quote[0].close || []).filter((c) => c != null) as number[];
  if (closes.length === 0) throw new Error(`Sin precio disponible para ${ticker}`);
  return closes[closes.length - 1];
}

export async function getYahooHistory(
  ticker: string,
  range: string = "2y"
): Promise<{ date: string; price: number }[]> {
  // ¡Nunca uses range=max en fondos! Yahoo lo comprime silenciosamente a
  // barras semanales aunque pidas interval=1d. range=2y da diario limpio.
  const result = await fetchChart(ticker, range);
  const timestamps = result.timestamp || [];
  const closes = result.indicators.quote[0].close || [];
  const out: { date: string; price: number }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null) continue;
    const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
    out.push({ date, price: close });
  }
  return out;
}
