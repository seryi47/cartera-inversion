import { FUND_TICKERS } from "@/lib/fund-tickers";
import { getYahooPrice, getYahooHistory } from "@/lib/yahoo";
import { getUsdToEurRate } from "@/lib/fx";

export async function getFundPriceEur(isin: string): Promise<number> {
  const info = FUND_TICKERS[isin];
  if (!info) throw new Error(`ISIN sin ticker configurado: ${isin}`);
  const price = await getYahooPrice(info.ticker);
  if (info.currency === "USD") {
    const rate = await getUsdToEurRate();
    return price * rate;
  }
  return price;
}

export async function getFundHistoryEur(isin: string, range = "2y") {
  const info = FUND_TICKERS[isin];
  if (!info) throw new Error(`ISIN sin ticker configurado: ${isin}`);
  const history = await getYahooHistory(info.ticker, range);
  if (info.currency === "USD") {
    const rate = await getUsdToEurRate();
    return history.map((h) => ({ date: h.date, price: h.price * rate }));
  }
  return history;
}
