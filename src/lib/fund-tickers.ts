// Mapeo ISIN -> ticker de Yahoo Finance, verificado de forma independiente
// (contrastado contra las fichas oficiales de las gestoras) para los 5 fondos
// que también vigila el bot de Telegram (BotTrading).
export const FUND_TICKERS: Record<string, { ticker: string; currency: "EUR" | "USD" }> = {
  IE000ZYRH0Q7: { ticker: "0P0001XF40.F", currency: "EUR" }, // iShares Developed World
  IE000QAZP7L2: { ticker: "0P0001XF3Z.F", currency: "EUR" }, // iShares Emerging Markets
  IE00BF4RFH31: { ticker: "IUSN.DE", currency: "EUR" },       // iShares Small Cap (IUSN)
  IE00B18GC888: { ticker: "0P00012I69.F", currency: "EUR" }, // Vanguard Global Bond
  IE00B579F325: { ticker: "SGLD.L", currency: "USD" },        // Invesco Physical Gold
};
