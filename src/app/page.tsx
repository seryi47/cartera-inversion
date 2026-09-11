import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import AddContributionForm from "@/components/AddContributionForm";
import Logo from "@/components/Logo";
import FundDistribution from "@/components/FundDistribution";
import DeleteRoundButton from "@/components/DeleteRoundButton";
import SignOutButton from "@/components/SignOutButton";
import PerformanceChart from "@/components/PerformanceChart";
import { getPortfolioPerformance, getPortfolioPerformanceIntraday } from "@/lib/portfolio-performance";

type Fund = {
  id: number;
  name: string;
  isin: string | null;
  target_weight: number;
  ter: number | null;
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = Number((session.user as { id: string }).id);

  const funds = (await sql`
    SELECT id, name, isin, target_weight, ter FROM funds
    WHERE user_id = ${userId} ORDER BY sort_order
  `) as unknown as Fund[];

  const totals = (await sql`
    SELECT fund_id, COALESCE(SUM(amount), 0) AS total
    FROM contributions WHERE user_id = ${userId}
    GROUP BY fund_id
  `) as unknown as { fund_id: number; total: number }[];

  const totalByFund: Record<number, number> = {};
  for (const t of totals) totalByFund[t.fund_id] = Number(t.total);

  const totalInvested = totals.reduce((acc, t) => acc + Number(t.total), 0);

  const rounds = (await sql`
    SELECT round_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, SUM(amount) AS total
    FROM contributions WHERE user_id = ${userId}
    GROUP BY round_id, date
    ORDER BY date DESC
    LIMIT 50
  `) as unknown as { round_id: string; date: string; total: number }[];

  const [performance, performanceIntraday] = await Promise.all([
    getPortfolioPerformance(userId),
    getPortfolioPerformanceIntraday(userId),
  ]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
              <Logo /> Patrimonio
            </h1>
            <nav className="flex gap-1 text-sm">
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold">Mi Cartera</span>
              <Link href="/mercado" className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-medium transition">
                Mercado
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <PerformanceChart daily={performance} intraday={performanceIntraday} />

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total invertido</p>
            <p className="text-3xl font-bold mt-1 text-slate-900">{fmt(totalInvested)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Fondos en la cartera</p>
            <p className="text-3xl font-bold mt-1 text-slate-900">{funds.length}</p>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold mb-4 text-slate-900">Distribución — objetivo vs real</h2>
          <FundDistribution
            funds={funds.map((f) => ({ id: f.id, name: f.name, isin: f.isin, target_weight: Number(f.target_weight) }))}
            totalByFund={totalByFund}
            totalInvested={totalInvested}
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AddContributionForm funds={funds.map((f) => ({ id: f.id, name: f.name, target_weight: Number(f.target_weight) }))} />

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold mb-4 text-slate-900">Historial de aportaciones</h2>
            {rounds.length === 0 ? (
              <p className="text-sm text-slate-500">Todavía no has registrado ninguna aportación.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rounds.map((r) => (
                  <li key={r.round_id} className="py-2 flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {new Date(r.date + "T00:00:00Z").toLocaleDateString("es-ES", { timeZone: "UTC" })}
                    </span>
                    <span className="font-medium text-slate-900">{fmt(Number(r.total))}</span>
                    <DeleteRoundButton roundId={r.round_id} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
