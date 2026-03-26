"use client";

import { useState } from "react";
import { Plus, Trash2, MessageSquare, Users, Phone, Mail, FileText, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertInteractionAction, deleteInteractionAction } from "@/app/dashboard/clients/[id]/actions";
import type { Interaction } from "@/types";

const typeConfig: Record<string, { label: string; icon: typeof Users }> = {
  meeting: { label: "Reunião", icon: Users },
  call: { label: "Ligação", icon: Phone },
  email: { label: "Email", icon: Mail },
  note: { label: "Anotação", icon: FileText },
};

export function InteractionsTab({ clientId, interactions }: { clientId: string; interactions: Interaction[] }) {
  const [adding, setAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    await upsertInteractionAction(clientId, {
      type: formData.get("type") as string,
      date: formData.get("date") as string || new Date().toISOString(),
      duration_minutes: Number(formData.get("duration_minutes")) || undefined,
      summary: formData.get("summary") as string,
      next_steps: (formData.get("next_steps") as string) || undefined,
      outcome: (formData.get("outcome") as string) || undefined,
      follow_up_date: (formData.get("follow_up_date") as string) || undefined,
      follow_up_description: (formData.get("follow_up_description") as string) || undefined,
    });
    setAdding(false);
  }

  async function handleDelete(interactionId: string) {
    if (!confirm("Excluir esta interação?")) return;
    await deleteInteractionAction(clientId, interactionId);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Linha do Tempo</h2>
        </div>
        {interactions.length > 0 ? (
          <div className="relative ml-4 border-l-2 border-border pl-6 space-y-4">
            {interactions.map((interaction) => {
              const config = typeConfig[interaction.type];
              const Icon = config?.icon ?? MessageSquare;
              const isOverdue = interaction.follow_up_date && interaction.follow_up_date < today;
              return (
                <div key={interaction.id} className="relative">
                  <div className="absolute -left-[33px] top-1 h-6 w-6 rounded-full bg-card border-2 border-border flex items-center justify-center">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{config?.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(interaction.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {interaction.duration_minutes && (
                        <span className="text-xs text-muted-foreground">· {interaction.duration_minutes} min</span>
                      )}
                      {interaction.follow_up_date && (
                        <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs ml-auto">
                          {isOverdue ? "Atrasado" : "Follow-up"}: {new Date(interaction.follow_up_date + "T00:00:00").toLocaleDateString("pt-BR")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{interaction.summary}</p>
                    {interaction.outcome && (
                      <p className="text-xs text-muted-foreground mt-1">Resultado: {interaction.outcome}</p>
                    )}
                    {interaction.next_steps && (
                      <p className="text-xs text-muted-foreground mt-0.5">Próximos passos: {interaction.next_steps}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            Nenhuma interação registrada.
          </div>
        )}
      </div>

      {/* Table CRUD */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Interações</h2>
            <span className="text-sm text-muted-foreground">({interactions.length})</span>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Nova Interação
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Data</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Tipo</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Resumo</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Duração</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Follow-up</th>
                <th className="w-10 p-3" />
              </tr>
            </thead>
            <tbody>
              {interactions.map((interaction) => {
                const isOverdue = interaction.follow_up_date && interaction.follow_up_date < today;
                return (
                  <tr key={interaction.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(interaction.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">{typeConfig[interaction.type]?.label}</Badge>
                    </td>
                    <td className="p-3 text-sm max-w-xs truncate">{interaction.summary}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {interaction.duration_minutes ? `${interaction.duration_minutes} min` : "—"}
                    </td>
                    <td className="p-3">
                      {interaction.follow_up_date ? (
                        <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
                          {new Date(interaction.follow_up_date + "T00:00:00").toLocaleDateString("pt-BR")}
                        </Badge>
                      ) : "—"}
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(interaction.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {adding && (
                <tr className="border-b border-border">
                  <td colSpan={6} className="p-3">
                    <form action={handleAdd} className="space-y-3">
                      <div className="flex items-end gap-2 flex-wrap">
                        <Input name="date" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} className="w-48" />
                        <Select name="type" defaultValue="meeting">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meeting">Reunião</SelectItem>
                            <SelectItem value="call">Ligação</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="note">Anotação</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input name="duration_minutes" type="number" placeholder="Duração (min)" className="w-32" />
                      </div>
                      <Textarea name="summary" placeholder="Resumo da interação *" required rows={2} />
                      <div className="flex items-end gap-2 flex-wrap">
                        <Input name="outcome" placeholder="Resultado" className="flex-1 min-w-[150px]" />
                        <Input name="next_steps" placeholder="Próximos passos" className="flex-1 min-w-[150px]" />
                      </div>
                      <div className="flex items-end gap-2 flex-wrap">
                        <Input name="follow_up_date" type="date" className="w-40" />
                        <Input name="follow_up_description" placeholder="Descrição do follow-up" className="flex-1 min-w-[150px]" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Salvar</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                      </div>
                    </form>
                  </td>
                </tr>
              )}
              {interactions.length === 0 && !adding && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    Nenhuma interação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
