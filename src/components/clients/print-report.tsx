"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatBRL, formatPercent } from "@/lib/utils";
import { computeRates, computeProjection } from "@/lib/projection-engine";
import type { Client, FinancialProfile, Asset, Liability, ProjectionScenario, ProjectionInput } from "@/types";

interface PrintReportProps {
  client: Client;
  financialProfile: FinancialProfile | null;
  assets: Asset[];
  liabilities: Liability[];
  scenario: ProjectionScenario | null;
}

export function PrintReport({ client, financialProfile: fp, assets, liabilities, scenario: sc }: PrintReportProps) {
  const printRef = useRef<HTMLDivElement>(null);

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

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório - ${client.full_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; font-size: 13px; line-height: 1.5; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 15px; margin: 24px 0 8px; border-bottom: 1px solid #e5e9f0; padding-bottom: 4px; }
          .subtitle { color: #6b7a90; font-size: 12px; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0; }
          .card { border: 1px solid #e5e9f0; border-radius: 8px; padding: 12px; }
          .card-label { font-size: 11px; color: #6b7a90; }
          .card-value { font-size: 16px; font-weight: 600; margin-top: 2px; }
          .green { color: #047857; }
          .red { color: #b91c1c; }
          .blue { color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e9f0; font-size: 12px; }
          th { color: #6b7a90; font-weight: 500; }
          .text-right { text-align: right; }
          .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e9f0; color: #6b7a90; font-size: 11px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <div class="footer">
          Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} — Pranej Fin Planejamento Financeiro
        </div>
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  const categoryLabels: Record<string, string> = {
    investment: "Investimento",
    property: "Imóvel",
    vehicle: "Veículo",
    other: "Outro",
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
        <Printer className="h-3.5 w-3.5" />
        Imprimir Relatório
      </Button>

      <div ref={printRef} className="hidden">
        <h1>Relatório Financeiro</h1>
        <p className="subtitle">{client.full_name} — {client.email ?? ""} — Idade: {currentAge} anos</p>

        <h2>Resumo Patrimonial</h2>
        <div className="grid">
          <div className="card">
            <div className="card-label">Patrimônio Líquido</div>
            <div className={`card-value ${netWorth >= 0 ? "green" : "red"}`}>{formatBRL(netWorth)}</div>
          </div>
          <div className="card">
            <div className="card-label">Total de Ativos</div>
            <div className="card-value">{formatBRL(totalAssets)}</div>
          </div>
          <div className="card">
            <div className="card-label">Total de Dívidas</div>
            <div className="card-value red">{formatBRL(totalLiabilities)}</div>
          </div>
        </div>

        <h2>Renda e Despesas</h2>
        <div className="grid">
          <div className="card">
            <div className="card-label">Renda Mensal</div>
            <div className="card-value">{formatBRL(fp?.monthly_income ?? 0)}</div>
          </div>
          <div className="card">
            <div className="card-label">Despesas Mensais</div>
            <div className="card-value">{formatBRL(fp?.monthly_expenses ?? 0)}</div>
          </div>
          <div className="card">
            <div className="card-label">Aporte Mensal</div>
            <div className="card-value blue">{formatBRL(fp?.monthly_contribution ?? 0)}</div>
          </div>
        </div>

        <h2>Projeção Patrimonial</h2>
        <div className="grid">
          <div className="card">
            <div className="card-label">Viver de Renda</div>
            <div className="card-value blue">{formatBRL(result.wealthForIncome)}</div>
          </div>
          <div className="card">
            <div className="card-label">Consumo de Capital</div>
            <div className="card-value green">{formatBRL(result.wealthForConsumption)}</div>
          </div>
          <div className="card">
            <div className="card-label">Patrimônio Projetado</div>
            <div className="card-value">{formatBRL(result.projectedWealth)}</div>
          </div>
        </div>
        <table>
          <tbody>
            <tr><td>Taxa real líquida a.a.</td><td className="text-right">{formatPercent(rates.realAnnual * 100)}</td></tr>
            <tr><td>Horizonte de acumulação</td><td className="text-right">{result.accumulationYears} anos ({currentAge} → {input.retirementAge})</td></tr>
            <tr><td>Renda necessária do portfólio</td><td className="text-right">{formatBRL(result.requiredMonthlyIncome)}/mês</td></tr>
            <tr><td>Meta</td><td className="text-right ${result.isGoalAchievable ? 'green' : 'red'}">{result.isGoalAchievable ? "Atingível" : "Revisão necessária"} — {formatBRL(Math.abs(result.gap))} de {result.isGoalAchievable ? "superávit" : "déficit"}</td></tr>
          </tbody>
        </table>

        {assets.length > 0 && (
          <>
            <h2>Ativos</h2>
            <table>
              <thead>
                <tr><th>Nome</th><th>Categoria</th><th className="text-right">Valor</th></tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}><td>{a.name}</td><td>{categoryLabels[a.category]}</td><td className="text-right">{formatBRL(a.current_value)}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {liabilities.length > 0 && (
          <>
            <h2>Dívidas</h2>
            <table>
              <thead>
                <tr><th>Nome</th><th className="text-right">Saldo</th><th className="text-right">Parcela</th><th className="text-right">Taxa</th></tr>
              </thead>
              <tbody>
                {liabilities.map((l) => (
                  <tr key={l.id}><td>{l.name}</td><td className="text-right">{formatBRL(l.remaining_amount)}</td><td className="text-right">{formatBRL(l.monthly_payment)}</td><td className="text-right">{(l.interest_rate * 100).toFixed(1)}%</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
