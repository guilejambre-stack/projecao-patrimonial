"use client";

import { useState } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertInsuranceAction, deleteInsuranceAction } from "@/app/dashboard/clients/[id]/actions";
import { formatBRL } from "@/lib/utils";
import type { Insurance } from "@/types";

const typeLabels: Record<string, string> = {
  life: "Vida",
  health: "Saúde",
  property: "Imóvel",
  vehicle: "Veículo",
  liability: "Responsabilidade Civil",
  other: "Outro",
};

export function InsuranceTable({ clientId, insurance }: { clientId: string; insurance: Insurance[] }) {
  const [adding, setAdding] = useState(false);

  const totalPremium = insurance.reduce((sum, i) => sum + i.monthly_premium, 0);

  async function handleAdd(formData: FormData) {
    await upsertInsuranceAction(clientId, {
      type: formData.get("type") as string,
      provider: formData.get("provider") as string,
      coverage_amount: Number(formData.get("coverage_amount")),
      monthly_premium: Number(formData.get("monthly_premium")),
      expiry_date: (formData.get("expiry_date") as string) || undefined,
      beneficiary: (formData.get("beneficiary") as string) || undefined,
    });
    setAdding(false);
  }

  async function handleDelete(insuranceId: string) {
    if (!confirm("Excluir este seguro?")) return;
    await deleteInsuranceAction(clientId, insuranceId);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Seguros</h3>
          </div>
          <p className="text-xs text-muted-foreground">Prêmio mensal total: {formatBRL(totalPremium)}</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Tipo</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Seguradora</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Cobertura</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Prêmio Mensal</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Vencimento</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {insurance.map((ins) => (
              <tr key={ins.id} className="border-b border-border last:border-0">
                <td className="p-3 text-sm">{typeLabels[ins.type]}</td>
                <td className="p-3 text-sm font-medium">{ins.provider}</td>
                <td className="p-3 text-sm text-right">{formatBRL(ins.coverage_amount)}</td>
                <td className="p-3 text-sm text-right font-medium">{formatBRL(ins.monthly_premium)}</td>
                <td className="p-3 text-sm text-muted-foreground">
                  {ins.expiry_date ? new Date(ins.expiry_date).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="p-3">
                  <button onClick={() => handleDelete(ins.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="border-b border-border">
                <td colSpan={6} className="p-3">
                  <form action={handleAdd} className="flex items-end gap-2 flex-wrap">
                    <Select name="type" defaultValue="life">
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="life">Vida</SelectItem>
                        <SelectItem value="health">Saúde</SelectItem>
                        <SelectItem value="property">Imóvel</SelectItem>
                        <SelectItem value="vehicle">Veículo</SelectItem>
                        <SelectItem value="liability">Resp. Civil</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input name="provider" placeholder="Seguradora" required className="flex-1 min-w-[120px]" />
                    <Input name="coverage_amount" type="number" placeholder="Cobertura" required className="w-28" />
                    <Input name="monthly_premium" type="number" placeholder="Prêmio" required className="w-24" />
                    <Input name="expiry_date" type="date" className="w-36" />
                    <Input name="beneficiary" placeholder="Beneficiário" className="w-32" />
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                  </form>
                </td>
              </tr>
            )}
            {insurance.length === 0 && !adding && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum seguro cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
