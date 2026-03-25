"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createScenarioAction, deleteScenarioAction } from "@/app/dashboard/clients/[id]/actions";
import { computeRates, computeProjection } from "@/lib/projection-engine";
import { formatBRL, formatBRLCompact, formatPercent } from "@/lib/utils";
import type { ProjectionScenario, FinancialProfile, ProjectionInput } from "@/types";

interface ScenarioComparisonProps {
  clientId: string;
  scenarios: ProjectionScenario[];
  financialProfile: FinancialProfile | null;
  currentAge: number;
}

export function ScenarioComparison({ clientId, scenarios, financialProfile: fp, currentAge }: ScenarioComparisonProps) {
  const [adding, setAdding] = useState(false);

  function getProjection(sc: ProjectionScenario) {
    const input: ProjectionInput = {
      currentAge,
      retirementAge: fp?.retirement_age ?? 65,
      lifeExpectancy: fp?.life_expectancy ?? 100,
      currentAssets: fp?.current_assets ?? 0,
      monthlyContribution: fp?.monthly_contribution ?? 0,
      cdiRate: sc.cdi_rate,
      cdiPercentage: sc.cdi_percentage,
      taxRate: sc.tax_rate,
      inflationRate: sc.inflation_rate,
      desiredRetirementIncome: fp?.desired_retirement_income ?? 0,
      socialSecurityIncome: fp?.social_security_income ?? 0,
      otherIncome: fp?.other_income ?? 0,
    };
    const rates = computeRates(input);
    const result = computeProjection(input, rates);
    return { rates, result };
  }

  async function handleAdd(formData: FormData) {
    await createScenarioAction(clientId, {
      name: formData.get("name") as string,
      cdi_rate: Number(formData.get("cdi_rate")) / 100,
      cdi_percentage: Number(formData.get("cdi_percentage")) / 100,
      tax_rate: Number(formData.get("tax_rate")) / 100,
      inflation_rate: Number(formData.get("inflation_rate")) / 100,
    });
    setAdding(false);
  }

  async function handleDelete(scenarioId: string) {
    if (!confirm("Excluir este cenário?")) return;
    await deleteScenarioAction(clientId, scenarioId);
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Comparação de Cenários</h3>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Novo Cenário
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Cenário</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">CDI</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">% CDI</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">IR</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Inflação</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Taxa Real</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Patrimônio Projetado</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Meta</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {scenarios.map((sc) => {
              const { rates, result } = getProjection(sc);
              return (
                <tr key={sc.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-sm font-medium">
                    {sc.name}
                    {sc.is_default && <span className="ml-1.5 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">padrão</span>}
                  </td>
                  <td className="p-3 text-sm text-right">{(sc.cdi_rate * 100).toFixed(1)}%</td>
                  <td className="p-3 text-sm text-right">{(sc.cdi_percentage * 100).toFixed(0)}%</td>
                  <td className="p-3 text-sm text-right">{(sc.tax_rate * 100).toFixed(1)}%</td>
                  <td className="p-3 text-sm text-right">{(sc.inflation_rate * 100).toFixed(1)}%</td>
                  <td className="p-3 text-sm text-right font-medium text-accent">{formatPercent(rates.realAnnual * 100)}</td>
                  <td className="p-3 text-sm text-right font-medium">{formatBRLCompact(result.projectedWealth)}</td>
                  <td className="p-3 text-sm text-right">
                    <span className={result.isGoalAchievable ? "text-accent" : "text-destructive"}>
                      {result.isGoalAchievable ? "Atingível" : "Déficit"}
                    </span>
                  </td>
                  <td className="p-3">
                    {!sc.is_default && (
                      <button onClick={() => handleDelete(sc.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {adding && (
              <tr className="border-b border-border">
                <td colSpan={9} className="p-3">
                  <form action={handleAdd} className="flex items-end gap-2">
                    <Input name="name" placeholder="Nome do cenário" required className="flex-1" />
                    <Input name="cdi_rate" type="number" step="0.1" placeholder="CDI %" defaultValue="7" required className="w-20" />
                    <Input name="cdi_percentage" type="number" step="5" placeholder="% CDI" defaultValue="110" required className="w-20" />
                    <Input name="tax_rate" type="number" step="0.5" placeholder="IR %" defaultValue="15" required className="w-20" />
                    <Input name="inflation_rate" type="number" step="0.1" placeholder="Infl %" defaultValue="3.5" required className="w-20" />
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                  </form>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
