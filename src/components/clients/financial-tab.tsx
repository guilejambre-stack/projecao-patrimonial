"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetTable } from "./asset-table";
import { LiabilityTable } from "./liability-table";
import { InsuranceTable } from "./insurance-table";
import { updateFinancialProfileAction } from "@/app/dashboard/clients/[id]/actions";
import { formatBRL } from "@/lib/utils";
import type { Client, FinancialProfile, Asset, Liability, Insurance } from "@/types";

const riskLabels: Record<string, string> = {
  conservative: "Conservador",
  moderate: "Moderado",
  aggressive: "Agressivo",
};

export function FinancialTab({
  client,
  financialProfile,
  assets,
  liabilities,
  insurance,
}: {
  client: Client;
  financialProfile: FinancialProfile | null;
  assets: Asset[];
  liabilities: Liability[];
  insurance: Insurance[];
}) {
  const fp = financialProfile;
  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remaining_amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  async function handleSaveProfile(formData: FormData) {
    const data: Record<string, number | string> = {
      monthly_income: Number(formData.get("monthly_income")),
      monthly_expenses: Number(formData.get("monthly_expenses")),
      monthly_contribution: Number(formData.get("monthly_contribution")),
      emergency_fund: Number(formData.get("emergency_fund")),
      current_assets: totalAssets,
      retirement_age: Number(formData.get("retirement_age")),
      life_expectancy: Number(formData.get("life_expectancy")),
      desired_retirement_income: Number(formData.get("desired_retirement_income")),
      social_security_income: Number(formData.get("social_security_income")),
      other_income: Number(formData.get("other_income")),
      risk_profile: formData.get("risk_profile") as string,
    };
    await updateFinancialProfileAction(client.id, data);
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Patrimônio líquido</p>
          <p className={`text-lg font-semibold ${netWorth >= 0 ? "text-accent" : "text-destructive"}`}>
            {formatBRL(netWorth)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Reserva de emergência</p>
          <p className="text-lg font-semibold">{formatBRL(fp?.emergency_fund ?? 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Perfil de risco</p>
          <p className="text-lg font-semibold">{riskLabels[fp?.risk_profile ?? "moderate"]}</p>
        </div>
      </div>

      <form action={handleSaveProfile} className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Renda e Despesas</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Renda mensal (R$)</Label>
              <Input name="monthly_income" type="number" defaultValue={fp?.monthly_income ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Despesas mensais (R$)</Label>
              <Input name="monthly_expenses" type="number" defaultValue={fp?.monthly_expenses ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Aporte mensal (R$)</Label>
              <Input name="monthly_contribution" type="number" defaultValue={fp?.monthly_contribution ?? 0} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Aposentadoria</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Idade aposentadoria</Label>
              <Input name="retirement_age" type="number" defaultValue={fp?.retirement_age ?? 65} />
            </div>
            <div className="space-y-1.5">
              <Label>Expectativa de vida</Label>
              <Input name="life_expectancy" type="number" defaultValue={fp?.life_expectancy ?? 100} />
            </div>
            <div className="space-y-1.5">
              <Label>Reserva emergência (R$)</Label>
              <Input name="emergency_fund" type="number" defaultValue={fp?.emergency_fund ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Renda desejada (R$)</Label>
              <Input name="desired_retirement_income" type="number" defaultValue={fp?.desired_retirement_income ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Renda INSS (R$)</Label>
              <Input name="social_security_income" type="number" defaultValue={fp?.social_security_income ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Outras rendas (R$)</Label>
              <Input name="other_income" type="number" defaultValue={fp?.other_income ?? 0} />
            </div>
          </div>
        </div>

        <div>
          <Label>Perfil de risco</Label>
          <Select name="risk_profile" defaultValue={fp?.risk_profile ?? "moderate"}>
            <SelectTrigger className="w-48 mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservador</SelectItem>
              <SelectItem value="moderate">Moderado</SelectItem>
              <SelectItem value="aggressive">Agressivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit">Salvar Perfil Financeiro</Button>
      </form>

      <AssetTable clientId={client.id} assets={assets} />
      <LiabilityTable clientId={client.id} liabilities={liabilities} />
      <InsuranceTable clientId={client.id} insurance={insurance} />
    </div>
  );
}
