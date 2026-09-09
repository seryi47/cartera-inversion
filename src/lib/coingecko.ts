export async function getCoinGeckoPrices(
  ids: string[]
): Promise<Record<string, { usd: number; usd_24h_change?: number }>> {
  if (ids.length === 0) return {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url, { headers: { "User-Agent": "PatrimonioApp/1.0" }, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  return res.json();
}
