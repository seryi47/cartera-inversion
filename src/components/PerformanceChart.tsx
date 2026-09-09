"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Point = { date: string; value: number; costBasis: number };
type Period = "semana" | "mes" | "año" | "max";

const PERIODS: { key: Period; label: string }[] = [
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "año", label: "Año" },
  { key: "max", label: "Máximo" },
];

const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

function cutoffFor(period: Period): Date | null {
  const now = new Date();
  if (period === "semana") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "mes") return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  if (period === "año") return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return null; // max
}

export default function PerformanceChart({ data }: { data: Point[] }) {
  const [period, setPeriod] = useState<Period>("mes");

  const filtered = useMemo(() => {
    const cutoff = cutoffFor(period);
    if (!cutoff) return data;
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const idx = data.findIndex((p) => p.date >= cutoffStr);
    return idx <= 0 ? data : data.slice(Math.max(0, idx - 1));
  }, [data, period]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold mb-2">Rentabilidad real</h2>
        <p className="text-sm text-slate-500">
          Todavía no hay datos suficientes — en cuanto registres tu primera aportación, aquí verás cómo
          evoluciona tu dinero frente a lo que has puesto.
        </p>
      </div>
    );
  }

  const last = filtered[filtered.length - 1];
  const gain = last.value - last.costBasis;
  const gainPct = last.costBasis > 0 ? (gain / last.costBasis) * 100 : 0;
  const isPositive = gain >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-semibold text-slate-900">Rentabilidad real</h2>
          <p className="text-xs text-slate-500 mt-0.5">Valor de la cartera vs. dinero aportado</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                period === p.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-xs text-slate-500">Valor actual</p>
          <p className="text-xl font-bold text-slate-900">{fmt(last.value)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Aportado</p>
          <p className="text-xl font-bold text-slate-900">{fmt(last.costBasis)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Ganancia/Pérdida</p>
          <p className={`text-xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "+" : ""}
            {fmt(gain)} ({isPositive ? "+" : ""}
            {gainPct.toFixed(1)}%)
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filtered} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(d: string) =>
                new Date(d + "T00:00:00Z").toLocaleDateString("es-ES", { day: "2-digit", month: "short", timeZone: "UTC" })
              }
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(v: number) => `${Math.round(v)}€`}
              width={55}
            />
            <Tooltip
              formatter={(value, name) => [fmt(Number(value)), name === "value" ? "Valor" : "Aportado"]}
              labelFormatter={(label) =>
                new Date(String(label) + "T00:00:00Z").toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })
              }
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
            />
            <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#valueFill)" />
            <Line type="monotone" dataKey="costBasis" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-blue-600" /> Valor de la cartera
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-slate-400" style={{ borderTop: "1.5px dashed #94a3b8" }} /> Aportado
        </span>
      </div>
    </div>
  );
}
