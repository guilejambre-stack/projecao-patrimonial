"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertLiabilityAction, deleteLiabilityAction } from "@/app/dashboard/clients/[id]/actions";
import { formatBRL } from "@/lib/utils";
import type { Liability } from "@/types";

export function LiabilityTable({ clientId, liabilities }: { clientId: string; liabilities: Liability[] }) {
  const [adding, setAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    await upsertLiabilityAction(clientId, {
      name: formData.get("name") as string,
      total_amount: Number(formData.get("total_amount")),
      remaining_amount: Number(formData.get("remaining_amount")),
      monthly_payment: Number(formData.get("monthly_payment")),
      interest_rate: Number(formData.get("interest_rate")),
      due_date: formData.get("due_date") as string || undefined,
    });
    setAdding(false);
  }

  async function handleDelete(liabilityId: string) {
    await deleteLiabilityAction(clientId, liabilityId);
  }

  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remaining_amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Dividas</h3>
          <p className="text-xs text-muted-foreground">Total: {formatBRL(totalLiabilities)}</p>
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
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Nome</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Saldo</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Parcela</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Taxa</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {liabilities.map((liability) => (
              <tr key={liability.id} className="border-b border-border last:border-0">
                <td className="p-3 text-sm">{liability.name}</td>
                <td className="p-3 text-sm text-right">{formatBRL(liability.remaining_amount)}</td>
                <td className="p-3 text-sm text-right">{formatBRL(liability.monthly_payment)}</td>
                <td className="p-3 text-sm text-right text-muted-foreground">{(liability.interest_rate * 100).toFixed(1)}%</td>
                <td className="p-3">
                  <button onClick={() => handleDelete(liability.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="border-b border-border">
                <td colSpan={5} className="p-3">
                  <form action={handleAdd} className="flex items-end gap-2">
                    <Input name="name" placeholder="Nome" required className="flex-1" />
                    <Input name="total_amount" type="number" placeholder="Total" required className="w-28" />
                    <Input name="remaining_amount" type="number" placeholder="Saldo" required className="w-28" />
                    <Input name="monthly_payment" type="number" placeholder="Parcela" required className="w-28" />
                    <Input name="interest_rate" type="number" step="0.001" placeholder="Taxa" required className="w-20" />
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                  </form>
                </td>
              </tr>
            )}
            {liabilities.length === 0 && !adding && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma divida cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
