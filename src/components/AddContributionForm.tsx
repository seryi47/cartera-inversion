"use client";

import { useState, useTransition } from "react";
import { addContributionRoundAction } from "@/lib/actions";

type Fund = { id: number; name: string; target_weight: number };

export default function AddContributionForm({ funds }: { funds: Fund[] }) {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addContributionRoundAction(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="font-semibold mb-4">Añadir aportación</h2>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="mode" value="auto" checked={mode === "auto"} onChange={() => setMode("auto")} />
          Reparto automático por pesos
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="mode" value="manual" checked={mode === "manual"} onChange={() => setMode("manual")} />
          Importe manual por fondo
        </label>
      </div>

      <label className="block text-sm font-medium mb-1">Fecha</label>
      <input
        name="date"
        type="date"
        defaultValue={today}
        required
        className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4"
      />

      {mode === "auto" ? (
        <>
          <label className="block text-sm font-medium mb-1">Importe total (€)</label>
          <input
            name="total"
            type="number"
            step="0.01"
            min="0"
            placeholder="150"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4"
          />
        </>
      ) : (
        <div className="space-y-2 mb-4">
          {funds.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <span className="text-sm flex-1">{f.name}</span>
              <input
                name={`amount_${f.id}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-28 border border-slate-300 rounded-lg px-2 py-1 text-right"
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 font-medium transition"
      >
        {pending ? "Guardando..." : "Guardar aportación"}
      </button>
    </form>
  );
}
