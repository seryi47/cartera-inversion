let cached: { rate: number; ts: number } = { rate: 0.86, ts: 0 };
const TTL_MS = 60 * 60 * 1000;

export async function getUsdToEurRate(): Promise<number> {
  if (Date.now() - cached.ts < TTL_MS) return cached.rate;
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const rate = data?.rates?.EUR;
    if (typeof rate === "number") cached = { rate, ts: Date.now() };
  } catch {
    // si falla, seguimos con el último valor conocido (o el de respaldo)
  }
  return cached.rate;
}
