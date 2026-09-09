import { sql } from "@/lib/db";

export type PerformancePoint = { date: string; value: number; costBasis: number };

/** Serie temporal de valor de cartera vs. dinero aportado, para un usuario. */
export async function getPortfolioPerformance(userId: number, sinceDate?: string): Promise<PerformancePoint[]> {
  const funds = (await sql`SELECT id, isin FROM funds WHERE user_id = ${userId}`) as unknown as {
    id: number;
    isin: string | null;
  }[];
  const isins = funds.map((f) => f.isin).filter((x): x is string => !!x);
  if (isins.length === 0) return [];

  const contributions = (await sql`
    SELECT TO_CHAR(c.date, 'YYYY-MM-DD') AS date, c.amount, c.price_at_purchase, f.isin
    FROM contributions c JOIN funds f ON f.id = c.fund_id
    WHERE c.user_id = ${userId}
    ORDER BY c.date ASC
  `) as unknown as { date: string; amount: number; price_at_purchase: number | null; isin: string }[];
  if (contributions.length === 0) return [];

  const firstDate = sinceDate && sinceDate > contributions[0].date ? sinceDate : contributions[0].date;

  const priceRowsAll = (await sql`
    SELECT isin, TO_CHAR(date, 'YYYY-MM-DD') AS date, price_eur FROM price_history
    WHERE date >= ${contributions[0].date}
    ORDER BY date ASC
  `) as unknown as { isin: string; date: string; price_eur: number }[];

  const pricesByIsin: Record<string, { date: string; price: number }[]> = {};
  for (const isin of isins) pricesByIsin[isin] = [];
  for (const row of priceRowsAll) {
    if (!isins.includes(row.isin)) continue;
    pricesByIsin[row.isin].push({ date: row.date, price: Number(row.price_eur) });
  }

  const allDatesSet = new Set<string>();
  for (const isin of isins) for (const p of pricesByIsin[isin]) allDatesSet.add(p.date);
  const allDates = Array.from(allDatesSet)
    .filter((d) => d >= firstDate)
    .sort();

  function priceOnOrBefore(isin: string, date: string): number | null {
    const arr = pricesByIsin[isin];
    let result: number | null = null;
    for (const p of arr) {
      if (p.date > date) break;
      result = p.price;
    }
    return result;
  }

  const points: PerformancePoint[] = [];
  for (const date of allDates) {
    let costBasis = 0;
    const sharesByIsin: Record<string, number> = {};
    for (const isin of isins) sharesByIsin[isin] = 0;

    for (const c of contributions) {
      if (c.date > date) continue;
      costBasis += Number(c.amount);
      const purchasePrice = Number(c.price_at_purchase) || priceOnOrBefore(c.isin, c.date) || null;
      if (purchasePrice) sharesByIsin[c.isin] += Number(c.amount) / purchasePrice;
    }

    let value = 0;
    for (const isin of isins) {
      const price = priceOnOrBefore(isin, date);
      if (price) value += sharesByIsin[isin] * price;
    }
    points.push({ date, value, costBasis });
  }
  return points;
}

export type IntradayPoint = { ts: number; value: number; costBasis: number };

/**
 * Igual que getPortfolioPerformance pero con resolución de minutos, usando
 * los snapshots de price_snapshots (cada ~15 min) en vez del histórico
 * diario — para las vistas cortas del gráfico (hoy / semana).
 */
export async function getPortfolioPerformanceIntraday(userId: number, sinceHours = 24 * 7): Promise<IntradayPoint[]> {
  const funds = (await sql`SELECT id, isin FROM funds WHERE user_id = ${userId}`) as unknown as {
    id: number;
    isin: string | null;
  }[];
  const isins = funds.map((f) => f.isin).filter((x): x is string => !!x);
  if (isins.length === 0) return [];

  const contributions = (await sql`
    SELECT TO_CHAR(c.date, 'YYYY-MM-DD') AS date, c.amount, c.price_at_purchase, f.isin
    FROM contributions c JOIN funds f ON f.id = c.fund_id
    WHERE c.user_id = ${userId}
    ORDER BY c.date ASC
  `) as unknown as { date: string; amount: number; price_at_purchase: number | null; isin: string }[];
  if (contributions.length === 0) return [];

  const snapshotRows = (await sql`
    SELECT isin, (EXTRACT(EPOCH FROM ts) * 1000)::bigint AS ts, price_eur
    FROM price_snapshots
    WHERE ts >= now() - make_interval(hours => ${sinceHours})
    ORDER BY ts ASC
  `) as unknown as { isin: string; ts: string | number; price_eur: number }[];
  if (snapshotRows.length === 0) return [];

  const pricesByIsin: Record<string, { ts: number; price: number }[]> = {};
  for (const isin of isins) pricesByIsin[isin] = [];
  for (const row of snapshotRows) {
    if (!isins.includes(row.isin)) continue;
    pricesByIsin[row.isin].push({ ts: Number(row.ts), price: Number(row.price_eur) });
  }

  const allTsSet = new Set<number>();
  for (const isin of isins) for (const p of pricesByIsin[isin]) allTsSet.add(p.ts);
  const allTs = Array.from(allTsSet).sort((a, b) => a - b);
  if (allTs.length === 0) return [];

  function priceOnOrBefore(isin: string, ts: number): number | null {
    const arr = pricesByIsin[isin];
    let result: number | null = null;
    for (const p of arr) {
      if (p.ts > ts) break;
      result = p.price;
    }
    return result;
  }

  const points: IntradayPoint[] = [];
  for (const ts of allTs) {
    const dateForTs = new Date(ts).toISOString().slice(0, 10);
    let costBasis = 0;
    const sharesByIsin: Record<string, number> = {};
    for (const isin of isins) sharesByIsin[isin] = 0;

    for (const c of contributions) {
      if (c.date > dateForTs) continue;
      costBasis += Number(c.amount);
      const purchasePrice = Number(c.price_at_purchase) || null;
      if (purchasePrice) sharesByIsin[c.isin] += Number(c.amount) / purchasePrice;
    }

    let value = 0;
    for (const isin of isins) {
      const price = priceOnOrBefore(isin, ts);
      if (price) value += sharesByIsin[isin] * price;
    }
    points.push({ ts, value, costBasis });
  }
  return points;
}
