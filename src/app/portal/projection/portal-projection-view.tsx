"use client";

import { useMemo } from "react";
import { KPICard } from "@/components/kpi-card";
import { MetricCard } from "@/components/metric-card";
import { ProjectionChart } from "@/components/projection-chart";
import { computeRates, computeProjection, generateSeries } from "@/lib/projection-engine";
import { formatBRL, formatBRLCompact, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import type { Client, FinancialProfile, ProjectionScenario, ProjectionInput, Goal } from "@/types";

const categoryLabels: Record<string, string> = {
  retirement: "Aposentadoria",
  education: "Educação",
  property: "Imóvel",
  travel: "Viagem",
  emergency: "Emergência",
  other: "Outro",
};

const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  low: { label: "Baixa", variant: "secondary" },
  medium: { label: "Média", variant: "default" },
  high: { label: "Alta", variant: "destructive" },
};

export function PortalProjectionView({
  client,
  financialProfile,
  scenario,
  goals,
}: {
  client: Client;
  financialProfile: FinancialProfile | null;
  scenario: ProjectionScenario | null;
  goals: Goal[];
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

      {goals.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Minhas Metas</h2>
          </div>
          <div className="divide-y divide-border">
            {goals.map((goal) => (
              <div key={goal.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{goal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {categoryLabels[goal.category]}
                    {goal.target_date && ` · até ${new Date(goal.target_date).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatBRL(goal.target_amount)}</span>
                  <Badge variant={priorityConfig[goal.priority].variant} className="text-xs">
                    {priorityConfig[goal.priority].label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
