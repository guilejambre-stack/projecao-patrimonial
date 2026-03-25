"use client";

import { useMemo } from "react";
import { KPICard } from "@/components/kpi-card";
import { MetricCard } from "@/components/metric-card";
import { ProjectionChart } from "@/components/projection-chart";
import { computeRates, computeProjection, generateSeries } from "@/lib/projection-engine";
import { formatBRL, formatBRLCompact, formatPercent } from "@/lib/utils";
import type { Client, FinancialProfile, ProjectionScenario, ProjectionInput } from "@/types";

export function PortalProjectionView({
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

  const input: ProjectionInput = useMemo(() => ({
    currentAge,
    retirementAge: fp?.retirement_age ?? 65,
    lifeExpectancy: fp?.life_expectancy ?? 100,
    currentAssets: fp?.current_assets ?? 0,
    monthlyContribution: fp?.monthly_contribution ?? 0,
    cdiRate: sc?.cdi_rate ?? 0.07,
    cdiPercentage: sc?.cdi_percentage ?? 1.1,
    taxRate: sc?.tax_rate ?? 0.15,
    inflationRate: sc?.inflation_rate ?? 0.035,
    desiredRetirementIncome: fp?.desired_retirement_income ?? 0,
    socialSecurityIncome: fp?.social_security_income ?? 0,
    otherIncome: fp?.other_income ?? 0,
  }), [fp, sc, currentAge]);

  const rates = useMemo(() => computeRates(input), [input]);
  const result = useMemo(() => computeProjection(input, rates), [input, rates]);
  const series = useMemo(() => generateSeries(input, rates), [input, rates]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Minha Projeção Patrimonial</h1>

      <div className="grid grid-cols-3 gap-3">
        <KPICard
          label="Viver de renda"
          value={formatBRLCompact(result.wealthForIncome)}
          subtitle={`${formatBRL(result.requiredMonthlyIncome)}/mês`}
          accentColor="blue"
        />
        <KPICard
          label="Patrimônio projetado"
          value={formatBRLCompact(result.projectedWealth)}
          subtitle={`Em ${result.accumulationYears} anos`}
          accentColor="green"
        />
        <KPICard
          label={result.isGoalAchievable ? "Meta atingível" : "Revisão necessária"}
          value={formatBRLCompact(Math.abs(result.gap))}
          subtitle={result.isGoalAchievable ? "superávit" : "déficit"}
          accentColor={result.isGoalAchievable ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Taxa real líquida a.a."
          value={formatPercent(rates.realAnnual * 100)}
        />
        <MetricCard
          label="Horizonte"
          value={`${result.accumulationYears} anos`}
        />
        <MetricCard
          label="Renda necessária"
          value={formatBRL(result.requiredMonthlyIncome)}
          subtitle="por mês"
        />
        <MetricCard
          label="Aporte mensal"
          value={formatBRL(input.monthlyContribution)}
        />
      </div>

      <ProjectionChart series={series} />
    </div>
  );
}
