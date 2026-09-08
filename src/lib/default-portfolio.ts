// La cartera que hemos definido: pesos objetivo de cada fondo/ETF.
// Se usa para sembrar los fondos de cada usuario nuevo al registrarse.

export const DEFAULT_PORTFOLIO = [
  { name: "iShares Developed World", isin: "IE000ZYRH0Q7", target_weight: 0.45, ter: 0.0006 },
  { name: "iShares Emerging Markets", isin: "IE000QAZP7L2", target_weight: 0.20, ter: 0.0016 },
  { name: "iShares Small Cap (IUSN)", isin: "IE00BF4RFH31", target_weight: 0.15, ter: 0.0035 },
  { name: "Vanguard Global Bond", isin: "IE00B18GC888", target_weight: 0.10, ter: 0.0015 },
  { name: "Invesco Physical Gold", isin: "IE00B579F325", target_weight: 0.10, ter: 0.0012 },
] as const;
