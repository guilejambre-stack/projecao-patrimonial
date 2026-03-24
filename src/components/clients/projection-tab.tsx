"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/kpi-card";
import { MetricCard } from "@/components/metric-card";
import { ProjectionChart } from "@/components/projection-chart";
import { computeRates, computeProjection, generateSeries } from "@/lib/projection-engine";
import { formatBRL, formatBRLCompact, formatPercent } from "@/lib/utils";
import { updateScenarioAction } from "@/app/dashboard/clients/[id]/actions";
import type { Client, FinancialProfile, ProjectionScenario, ProjectionInput } from "@/types";

export function ProjectionTab({
  client,
  financialProfile,
  scenario,
}: {
  client: Client;
  financialProfile: FinancialProfile | null;
  scenario: ProjectionScenario | null;
}) {
  const fp = financialProfile;
  const sc = scenario;

  const birthYear = client.birth_date ? new Date(client.birth_date).getFullYear() : null;
  const currentAge = birthYear ? new Date().getFullYear() - birthYear : 40;

  const [params, setParams] = useState({
    cdiRate: (sc?.cdi_rate ?? 0.07) * 100,
    cdiPercentage: (sc?.cdi_percentage ?? 1.1) * 100,
    taxRate: (sc?.tax_rate ?? 0.15) * 100,
    inflationRate: (sc?.inflation_rate ?? 0.035) * 100,
  });

  const input: ProjectionInput = useMemo(() => ({
    currentAge,
    retirementAge: fp?.retirement_age ?? 65,
    lifeExpectancy: fp?.life_expectancy ?? 100,
    currentAssets: fp?.current_assets ?? 0,
    monthlyContribution: fp?.monthly_contribution ?? 0,
    cdiRate: params.cdiRate / 100,
    cdiPercentage: params.cdiPercentage / 100,
    taxRate: params.taxRate / 100,
    inflationRate: params.inflationRate / 100,
    desiredRetirementIncome: fp?.desired_retirement_income ?? 0,
    socialSecurityIncome: fp?.social_security_income ?? 0,
    otherIncome: fp?.other_income ?? 0,
  }), [fp, currentAge, params]);

  const rates = useMemo(() => computeRates(input), [input]);
  const result = useMemo(() => computeProjection(input, rates), [input, rates]);
  const series = useMemo(() => generateSeries(input, rates), [input, rates]);

  async function handleSaveScenario() {
    if (!sc) return;
    await updateScenarioAction(sc.id, client.id, {
      cdi_rate: params.cdiRate / 100,
      cdi_percentage: params.cdiPercentage / 100,
      tax_rate: params.taxRate / 100,
      inflation_rate: params.inflationRate / 100,
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">Parametros de Taxas</h3>
        <div className="grid grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">CDI anual (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={params.cdiRate}
              onChange={(e) => setParams((p) => ({ ...p, cdiRate: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">% do CDI</Label>
            <Input
              type="number"
              step="5"
              value={params.cdiPercentage}
              onChange={(e) => setParams((p) => ({ ...p, cdiPercentage: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Aliquota IR (%)</Label>
            <Input
              type="number"
              step="0.5"
              value={params.taxRate}
              onChange={(e) => setParams((p) => ({ ...p, taxRate: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Inflacao anual (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={params.inflationRate}
              onChange={(e) => setParams((p) => ({ ...p, inflationRate: Number(e.target.value) }))}
            />
          </div>
          <Button size="sm" onClick={handleSaveScenario}>Salvar taxas</Button>
        </div>
        <p className="text-xs text-accent mt-2">
          Taxa real liquida a.a.: {formatPercent(rates.realAnnual * 100)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KPICard
          label="Viver de renda (preservar capital)"
          value={formatBRLCompact(result.wealthForIncome)}
          subtitle={`Renda: ${formatBRL(result.requiredMonthlyIncome)}/mes em juros`}
          accentColor="blue"
        />
        <KPICard
          label="Consumo de capital"
          value={formatBRLCompact(result.wealthForConsumption)}
          subtitle={`Capital zerado em ${result.distributionYears} anos`}
          accentColor="green"
        />
        <KPICard
          label="Patrimonio projetado (simulacao)"
          value={formatBRLCompact(result.projectedWealth)}
          subtitle={`Aportando ${formatBRL(input.monthlyContribution)}/mes por ${result.accumulationYears} anos`}
          accentColor="red"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Taxa real liquida a.a."
          value={formatPercent(rates.realAnnual * 100)}
          subtitle={`Mensal: ${formatPercent(rates.realMonthly * 100, 3)}`}
        />
        <MetricCard
          label="Horizonte de acumulacao"
          value={`${result.accumulationYears} anos`}
          subtitle={`${input.currentAge} → ${input.retirementAge} anos`}
        />
        <MetricCard
          label="Renda necessaria do portfolio"
          value={formatBRL(result.requiredMonthlyIncome)}
          subtitle="por mes"
        />
        <MetricCard
          label="Diferenca (simulacao vs meta)"
          value={formatBRLCompact(Math.abs(result.gap))}
          subtitle={result.isGoalAchievable ? "superavit" : "deficit"}
          valueClassName={result.isGoalAchievable ? "text-accent" : "text-destructive"}
        />
      </div>

      <ProjectionChart series={series} />
    </div>
  );
}
