import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { getMarketOverview, type MarketRow } from "@/lib/market-watchlist";

export const revalidate = 60;

function fmtUsd(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function fmtEur(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

function RowCard({ row }: { row: MarketRow }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="font-semibold text-slate-900">{row.name}</p>
        <p className="text-xs text-slate-500">{row.symbol}</p>
      </div>
      {row.error ? (
        <span className="text-xs text-red-600">sin datos</span>
      ) : (
        <div className="text-right">
          <p className="font-bold text-slate-900">{fmtUsd(row.priceUsd)}</p>
          <p className="text-xs text-slate-500">{fmtEur(row.priceEur)}</p>
          {row.change24h != null && (
            <p className={`text-xs font-semibold ${row.change24h >= 0 ? "text-green-600" : "text-red-600"}`}>
              {row.change24h >= 0 ? "+" : ""}
              {row.change24h.toFixed(2)}% (24h)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default async function MercadoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let rows: MarketRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await getMarketOverview();
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  const cripto = rows.filter((r) => r.kind === "crypto");
  const acciones = rows.filter((r) => r.kind === "stock" && !r.dca);
  const fondos = rows.filter((r) => r.dca);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-semibold text-lg text-slate-900">💼 Patrimonio</h1>
            <nav className="flex gap-1 text-sm">
              <Link href="/" className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-medium transition">
                Mi Cartera
              </Link>
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold">Mercado</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Precios en vivo</h2>
          <p className="text-sm text-slate-500 mt-1">
            Todo lo que vigila el bot de Telegram, en un solo sitio — se actualiza cada minuto.
          </p>
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            No pude cargar la lista de activos: {loadError}
          </div>
        )}

        {cripto.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">🪙 Cripto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cripto.map((r) => (
                <RowCard key={r.symbol} row={r} />
              ))}
            </div>
          </section>
        )}

        {acciones.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">📈 Acciones vigiladas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {acciones.map((r) => (
                <RowCard key={r.symbol} row={r} />
              ))}
            </div>
          </section>
        )}

        {fondos.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">🏦 Fondos de MyInvestor</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fondos.map((r) => (
                <RowCard key={r.symbol} row={r} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
