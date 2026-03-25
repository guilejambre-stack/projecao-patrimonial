import { computeRates, computeProjection, generateSeries } from "./projection-engine";
import type { Client, FinancialProfile, ProjectionScenario, ProjectionInput, Asset, Liability } from "@/types";

export interface ReportData {
  client: Client;
  financialProfile: FinancialProfile | null;
  assets: Asset[];
  liabilities: Liability[];
  scenario: ProjectionScenario | null;
  generatedAt: string;
}

export function generateClientReport(data: ReportData) {
  const { client, financialProfile: fp, assets, liabilities, scenario: sc } = data;

  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remaining_amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  const birthYear = client.birth_date ? new Date(client.birth_date).getFullYear() : null;
  const currentAge = birthYear ? new Date().getFullYear() - birthYear : 40;

  const input: ProjectionInput = {
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
  };

  const rates = computeRates(input);
  const result = computeProjection(input, rates);
  const series = generateSeries(input, rates);

  return {
    client,
    currentAge,
    netWorth,
    totalAssets,
    totalLiabilities,
    financialProfile: fp,
    assets,
    liabilities,
    input,
    rates,
    result,
    series,
    generatedAt: data.generatedAt,
  };
}

export function formatReportAsCSV(data: ReportData): string {
  const report = generateClientReport(data);
  const lines: string[] = [];

  lines.push("Relatório de Projeção Patrimonial");
  lines.push(`Cliente,${report.client.full_name}`);
  lines.push(`Gerado em,${report.generatedAt}`);
  lines.push("");

  lines.push("Resumo Financeiro");
  lines.push(`Patrimônio Líquido,${report.netWorth}`);
  lines.push(`Total de Ativos,${report.totalAssets}`);
  lines.push(`Total de Dívidas,${report.totalLiabilities}`);
  lines.push(`Renda Mensal,${report.financialProfile?.monthly_income ?? 0}`);
  lines.push(`Despesas Mensais,${report.financialProfile?.monthly_expenses ?? 0}`);
  lines.push(`Aporte Mensal,${report.financialProfile?.monthly_contribution ?? 0}`);
  lines.push("");

  lines.push("Projeção");
  lines.push(`Patrimônio para Viver de Renda,${report.result.wealthForIncome}`);
  lines.push(`Patrimônio para Consumo de Capital,${report.result.wealthForConsumption}`);
  lines.push(`Patrimônio Projetado,${report.result.projectedWealth}`);
  lines.push(`Meta Atingível,${report.result.isGoalAchievable ? "Sim" : "Não"}`);
  lines.push(`Diferença,${report.result.gap}`);
  lines.push("");

  lines.push("Ativos");
  lines.push("Nome,Categoria,Valor");
  for (const a of report.assets) {
    lines.push(`${a.name},${a.category},${a.current_value}`);
  }
  lines.push("");

  lines.push("Dívidas");
  lines.push("Nome,Saldo Devedor,Parcela Mensal,Taxa");
  for (const l of report.liabilities) {
    lines.push(`${l.name},${l.remaining_amount},${l.monthly_payment},${l.interest_rate}`);
  }
  lines.push("");

  lines.push("Série Temporal");
  lines.push("Idade,Viver de Renda,Consumo de Capital,Simulação");
  for (let i = 0; i < report.series.ages.length; i++) {
    lines.push(`${report.series.ages[i]},${report.series.incomePreserving[i]},${report.series.capitalConsumption[i]},${report.series.simulated[i]}`);
  }

  return lines.join("\n");
}
