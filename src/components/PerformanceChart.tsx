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

type DailyPoint = { date: string; value: number; costBasis: number };
type IntradayPoint = { ts: number; value: number; costBasis: number };
type ChartPoint = { x: number; value: number; costBasis: number };
type Period = "hoy" | "semana" | "mes" | "año" | "max";

const PERIODS: { key: Period; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "año", label: "Año" },
  { key: "max", label: "Máximo" },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

function cutoffFor(period: Period): number | null {
  const now = Date.now();
  if (period === "hoy") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (period === "semana") return now - 7 * DAY_MS;
  if (period === "mes") return now - 31 * DAY_MS;
  if (period === "año") return now - 366 * DAY_MS;
  return null; // max
}

function tickFormat(x: number, period: Period): string {
  const opts: Intl.DateTimeFormatOptions =
    period === "hoy"
      ? { hour: "2-digit", minute: "2-digit" }
      : period === "semana"
        ? { weekday: "short", hour: "2-digit", minute: "2-digit" }
        : period === "max"
          ? { month: "short", year: "numeric" }
          : { day: "2-digit", month: "short" };
  return new Intl.DateTimeFormat("es-ES", opts).format(new Date(x));
}

function labelFormat(x: number, period: Period): string {
  const opts: Intl.DateTimeFormatOptions =
    period === "hoy" || period === "semana"
      ? { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat("es-ES", opts).format(new Date(x));
}

export default function PerformanceChart({ daily, intraday }: { daily: DailyPoint[]; intraday: IntradayPoint[] }) {
  const [period, setPeriod] = useState<Period>("mes");
  const usesIntraday = period === "hoy" || period === "semana";

  const allPoints: ChartPoint[] = useMemo(() => {
    if (usesIntraday) return intraday.map((p) => ({ x: p.ts, value: p.value, costBasis: p.costBasis }));
    return daily.map((p) => ({ x: Date.parse(p.date + "T00:00:00Z"), value: p.value, costBasis: p.costBasis }));
  }, [usesIntraday, daily, intraday]);

  const filtered = useMemo(() => {
    const cutoff = cutoffFor(period);
    if (cutoff == null) return allPoints;
    const idx = allPoints.findIndex((p) => p.x >= cutoff);
    return idx <= 0 ? allPoints : allPoints.slice(Math.max(0, idx - 1));
  }, [allPoints, period]);

  if (daily.length === 0) {
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

  const lastDaily = daily[daily.length - 1];
  const last = filtered.length > 0 ? filtered[filtered.length - 1] : { x: 0, value: lastDaily.value, costBasis: lastDaily.costBasis };
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
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

      {filtered.length >= 2 ? (
        <>
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
                  dataKey="x"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(x: number) => tickFormat(x, period)}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v: number) => `${Math.round(v)}€`}
                  width={55}
                  domain={["dataMin", "dataMax"]}
                />
                <Tooltip
                  formatter={(value, name) => [fmt(Number(value)), name === "value" ? "Valor" : "Aportado"]}
                  labelFormatter={(label) => labelFormat(Number(label), period)}
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
        </>
      ) : (
        <div className="h-40 flex items-center justify-center rounded-lg bg-slate-50 border border-dashed border-slate-200">
          <p className="text-sm text-slate-500 text-center px-6">
            {usesIntraday
              ? "Todavía no hay suficientes precios de hoy — se actualizan cada 15 min, vuelve en un rato."
              : "Con un solo día de datos aún no hay curva que dibujar — vuelve mañana (o registra otra aportación en otra fecha) y aquí aparecerá la evolución."}
          </p>
        </div>
      )}
    </div>
  );
}
