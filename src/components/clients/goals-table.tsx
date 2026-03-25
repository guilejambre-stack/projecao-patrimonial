"use client";

import { useState } from "react";
import { Plus, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertGoalAction, deleteGoalAction } from "@/app/dashboard/clients/[id]/actions";
import { formatBRL } from "@/lib/utils";
import type { Goal } from "@/types";

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

export function GoalsTable({ clientId, goals }: { clientId: string; goals: Goal[] }) {
  const [adding, setAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    await upsertGoalAction(clientId, {
      name: formData.get("name") as string,
      target_amount: Number(formData.get("target_amount")),
      target_date: (formData.get("target_date") as string) || undefined,
      priority: (formData.get("priority") as string) || "medium",
      category: (formData.get("category") as string) || "other",
    });
    setAdding(false);
  }

  async function handleDelete(goalId: string) {
    if (!confirm("Excluir esta meta?")) return;
    await deleteGoalAction(clientId, goalId);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Metas Financeiras</h2>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Adicionar Meta
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Meta</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Categoria</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Valor Alvo</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Data Alvo</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Prioridade</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => (
              <tr key={goal.id} className="border-b border-border last:border-0">
                <td className="p-3 text-sm font-medium">{goal.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{categoryLabels[goal.category]}</td>
                <td className="p-3 text-sm text-right font-medium">{formatBRL(goal.target_amount)}</td>
                <td className="p-3 text-sm text-muted-foreground">
                  {goal.target_date ? new Date(goal.target_date).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="p-3">
                  <Badge variant={priorityConfig[goal.priority].variant} className="text-xs">
                    {priorityConfig[goal.priority].label}
                  </Badge>
                </td>
                <td className="p-3">
                  <button onClick={() => handleDelete(goal.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="border-b border-border">
                <td colSpan={6} className="p-3">
                  <form action={handleAdd} className="flex items-end gap-2 flex-wrap">
                    <Input name="name" placeholder="Nome da meta" required className="flex-1 min-w-[150px]" />
                    <Select name="category" defaultValue="other">
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retirement">Aposentadoria</SelectItem>
                        <SelectItem value="education">Educação</SelectItem>
                        <SelectItem value="property">Imóvel</SelectItem>
                        <SelectItem value="travel">Viagem</SelectItem>
                        <SelectItem value="emergency">Emergência</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input name="target_amount" type="number" placeholder="Valor alvo" required className="w-32" />
                    <Input name="target_date" type="date" className="w-36" />
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                  </form>
                </td>
              </tr>
            )}
            {goals.length === 0 && !adding && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                  Nenhuma meta cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
