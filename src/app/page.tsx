import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import AddContributionForm from "@/components/AddContributionForm";
import DeleteRoundButton from "@/components/DeleteRoundButton";
import SignOutButton from "@/components/SignOutButton";

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

  const totalByFund = new Map<number, number>();
  for (const t of totals) totalByFund.set(t.fund_id, Number(t.total));

  const totalInvested = totals.reduce((acc, t) => acc + Number(t.total), 0);

  const rounds = (await sql`
    SELECT round_id, date, SUM(amount) AS total
    FROM contributions WHERE user_id = ${userId}
    GROUP BY round_id, date
    ORDER BY date DESC
    LIMIT 50
  `) as unknown as { round_id: string; date: string; total: number }[];

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-semibold text-lg">Mi Cartera</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total invertido</p>
            <p className="text-3xl font-bold mt-1">{fmt(totalInvested)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Fondos en la cartera</p>
            <p className="text-3xl font-bold mt-1">{funds.length}</p>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Distribución — objetivo vs real</h2>
          <div className="space-y-4">
            {funds.map((f) => {
              const actual = totalByFund.get(f.id) || 0;
              const actualPct = totalInvested > 0 ? (actual / totalInvested) * 100 : 0;
              const targetPct = Number(f.target_weight) * 100;
              const drift = actualPct - targetPct;
              return (
                <div key={f.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">
                      {f.name}{" "}
                      {f.isin && <span className="text-slate-400 font-normal">({f.isin})</span>}
                    </span>
                    <span className="text-slate-600">
                      {fmt(actual)} · {actualPct.toFixed(1)}% objetivo {targetPct.toFixed(0)}%
                      {Math.abs(drift) >= 2 && (
                        <span className={drift > 0 ? "text-amber-600" : "text-blue-600"}>
                          {" "}
                          ({drift > 0 ? "+" : ""}
                          {drift.toFixed(1)} pts)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(actualPct, 100)}%` }}
                    />
                    <div
                      className="absolute top-0 h-2 w-0.5 bg-slate-500"
                      style={{ left: `${Math.min(targetPct, 100)}%` }}
                      title={`Objetivo: ${targetPct.toFixed(0)}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AddContributionForm funds={funds.map((f) => ({ id: f.id, name: f.name, target_weight: Number(f.target_weight) }))} />

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold mb-4">Historial de aportaciones</h2>
            {rounds.length === 0 ? (
              <p className="text-sm text-slate-500">Todavía no has registrado ninguna aportación.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rounds.map((r) => (
                  <li key={r.round_id} className="py-2 flex items-center justify-between text-sm">
                    <span>{new Date(r.date).toLocaleDateString("es-ES")}</span>
                    <span className="font-medium">{fmt(Number(r.total))}</span>
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
