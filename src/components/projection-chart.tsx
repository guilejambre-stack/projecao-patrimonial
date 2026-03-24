"use client";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Line,
  ComposedChart,
} from "recharts";
import { formatBRL } from "@/lib/utils";
import type { ProjectionSeries } from "@/types";

interface ProjectionChartProps {
  series: ProjectionSeries;
}

export function ProjectionChart({ series }: ProjectionChartProps) {
  const data = series.ages.map((age, i) => ({
    age,
    incomePreserving: series.incomePreserving[i],
    capitalConsumption: series.capitalConsumption[i],
    simulated: series.simulated[i],
  }));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Projecao Patrimonial</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evolucao do patrimonio por cenario — idade {series.ages[0]} → {series.ages[series.ages.length - 1]} anos
          </p>
        </div>
        <div className="flex gap-4">
          <LegendItem color="#3B82F6" label="Viver de renda" />
          <LegendItem color="#10B981" label="Consumo" />
          <LegendItem color="#DC2626" label="Simulacao" dashed />
        </div>
      </div>
      <div className="p-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis
              dataKey="age"
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => (v % 5 === 0 ? String(v) : "")}
            />
            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1e6
                  ? `R$ ${(v / 1e6).toFixed(1)}M`
                  : v >= 1e3
                  ? `R$ ${Math.round(v / 1e3)}k`
                  : ""
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1D26",
                border: "1px solid #2A2D36",
                borderRadius: "8px",
                fontSize: 12,
              }}
              labelFormatter={(age) => `Idade: ${age} anos`}
              formatter={(value, name) => {
                const num = typeof value === "number" ? value : Number(value);
                const labels: Record<string, string> = {
                  incomePreserving: "Viver de renda",
                  capitalConsumption: "Consumo",
                  simulated: "Simulacao",
                };
                return [formatBRL(isNaN(num) ? 0 : num), labels[String(name)] ?? String(name)];
              }}
            />
            <Area
              type="monotone"
              dataKey="incomePreserving"
              stroke="#3B82F6"
              fill="rgba(59,130,246,0.07)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="capitalConsumption"
              stroke="#10B981"
              fill="rgba(16,185,129,0.06)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="simulated"
              stroke="#DC2626"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
      <div
        className="w-4 h-0.5 rounded-full"
        style={{
          backgroundColor: dashed ? "transparent" : color,
          ...(dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 7px)` } : {}),
        }}
      />
      {label}
    </div>
  );
}
