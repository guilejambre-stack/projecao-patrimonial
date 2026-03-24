"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertAssetAction, deleteAssetAction } from "@/app/dashboard/clients/[id]/actions";
import { formatBRL } from "@/lib/utils";
import type { Asset } from "@/types";

const categoryLabels: Record<string, string> = {
  investment: "Investimento",
  property: "Imovel",
  vehicle: "Veiculo",
  other: "Outro",
};

export function AssetTable({ clientId, assets }: { clientId: string; assets: Asset[] }) {
  const [adding, setAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    await upsertAssetAction(clientId, {
      category: formData.get("category") as string,
      name: formData.get("name") as string,
      current_value: Number(formData.get("current_value")),
      monthly_yield_rate: Number(formData.get("monthly_yield_rate")) || undefined,
      notes: formData.get("notes") as string || undefined,
    });
    setAdding(false);
  }

  async function handleDelete(assetId: string) {
    await deleteAssetAction(clientId, assetId);
  }

  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Patrimonio</h3>
          <p className="text-xs text-muted-foreground">Total: {formatBRL(totalAssets)}</p>
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
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Categoria</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Valor</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-border last:border-0">
                <td className="p-3 text-sm">{asset.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{categoryLabels[asset.category]}</td>
                <td className="p-3 text-sm text-right font-medium">{formatBRL(asset.current_value)}</td>
                <td className="p-3">
                  <button onClick={() => handleDelete(asset.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="border-b border-border">
                <td colSpan={4} className="p-3">
                  <form action={handleAdd} className="flex items-end gap-2">
                    <Input name="name" placeholder="Nome do ativo" required className="flex-1" />
                    <Select name="category" defaultValue="investment">
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investment">Investimento</SelectItem>
                        <SelectItem value="property">Imovel</SelectItem>
                        <SelectItem value="vehicle">Veiculo</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input name="current_value" type="number" placeholder="Valor" required className="w-32" />
                    <Input name="monthly_yield_rate" type="number" step="0.01" placeholder="Rend. %" className="w-24" />
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                  </form>
                </td>
              </tr>
            )}
            {assets.length === 0 && !adding && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum ativo cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
