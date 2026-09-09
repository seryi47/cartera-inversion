"use client";

import { useState, useTransition } from "react";
import { updateFundWeightAction } from "@/lib/actions";

type Fund = { id: number; name: string; isin: string | null; target_weight: number };

const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export default function FundDistribution({
  funds,
  totalByFund,
  totalInvested,
}: {
  funds: Fund[];
  totalByFund: Record<number, number>;
  totalInvested: number;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const weightSum = funds.reduce((acc, f) => acc + Number(f.target_weight), 0) * 100;

  function startEdit(f: Fund) {
    setEditingId(f.id);
    setDraft((Number(f.target_weight) * 100).toString());
  }

  function save(fundId: number) {
    const pct = Number(draft.replace(",", "."));
    setEditingId(null);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return;
    startTransition(() => updateFundWeightAction(fundId, pct / 100));
  }

  return (
    <div className="space-y-4">
      {Math.abs(weightSum - 100) >= 0.5 && (
        <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Los objetivos suman {weightSum.toFixed(1)}% — deberían sumar 100%.
        </p>
      )}
      {funds.map((f) => {
        const actual = totalByFund[f.id] || 0;
        const actualPct = totalInvested > 0 ? (actual / totalInvested) * 100 : 0;
        const targetPct = Number(f.target_weight) * 100;
        const drift = actualPct - targetPct;
        const isEditing = editingId === f.id;

        return (
          <div key={f.id}>
            <div className="flex flex-wrap justify-between items-center text-sm mb-1 gap-x-2 gap-y-1">
              <span className="font-medium text-slate-800">
                {f.name} {f.isin && <span className="text-slate-400 font-normal">({f.isin})</span>}
              </span>
              <span className="text-slate-600 flex items-center gap-2">
                <span>
                  {fmt(actual)} · {actualPct.toFixed(1)}%
                </span>

                {isEditing ? (
                  <span className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={draft}
                      disabled={pending}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") save(f.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-16 border border-blue-300 rounded px-1.5 py-0.5 text-right text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <span className="text-xs text-slate-400">%</span>
                    <button
                      onClick={() => save(f.id)}
                      disabled={pending}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => startEdit(f)}
                    title="Cambiar el % objetivo"
                    className="text-slate-500 hover:text-blue-600 underline decoration-dotted underline-offset-2 decoration-slate-300"
                  >
                    objetivo {targetPct.toFixed(0)}%
                  </button>
                )}

                {!isEditing && Math.abs(drift) >= 2 && (
                  <span className={drift > 0 ? "text-amber-600" : "text-blue-600"}>
                    ({drift > 0 ? "+" : ""}
                    {drift.toFixed(1)} pts)
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(actualPct, 100)}%` }} />
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
  );
}
