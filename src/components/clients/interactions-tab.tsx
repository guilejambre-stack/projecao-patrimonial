"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Users,
  Phone,
  Mail,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
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
import {
  upsertInteractionAction,
  deleteInteractionAction,
} from "@/app/dashboard/clients/[id]/actions";
import type { Interaction } from "@/types";

const typeConfig = {
  meeting: { label: "Reunião", icon: Users, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  call: { label: "Ligação", icon: Phone, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  email: { label: "Email", icon: Mail, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  note: { label: "Anotação", icon: FileText, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
} as const;

type InteractionTypeKey = keyof typeof typeConfig;

const filterOptions = [
  { value: "all", label: "Todas" },
  { value: "meeting", label: "Reuniões" },
  { value: "call", label: "Ligações" },
  { value: "email", label: "Emails" },
  { value: "note", label: "Anotações" },
];

export function InteractionsTab({
  clientId,
  interactions,
}: {
  clientId: string;
  interactions: Interaction[];
}) {
  const [addingType, setAddingType] = useState<InteractionTypeKey | null>(null);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quickNote, setQuickNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filtered =
    filter === "all"
      ? interactions
      : interactions.filter((i) => i.type === filter);

  const overdueCount = interactions.filter(
    (i) => i.follow_up_date && i.follow_up_date < today
  ).length;

  async function handleQuickNote() {
    if (!quickNote.trim()) return;
    setSavingNote(true);
    await upsertInteractionAction(clientId, {
      type: "note",
      date: new Date().toISOString(),
      summary: quickNote.trim(),
    });
    setQuickNote("");
    setSavingNote(false);
  }

  async function handleAdd(formData: FormData) {
    await upsertInteractionAction(clientId, {
      type: formData.get("type") as string,
      date: (formData.get("date") as string) || new Date().toISOString(),
      duration_minutes: Number(formData.get("duration_minutes")) || undefined,
      summary: formData.get("summary") as string,
      next_steps: (formData.get("next_steps") as string) || undefined,
      outcome: (formData.get("outcome") as string) || undefined,
      follow_up_date: (formData.get("follow_up_date") as string) || undefined,
      follow_up_description:
        (formData.get("follow_up_description") as string) || undefined,
    });
    setAddingType(null);
  }

  async function handleDelete(interactionId: string) {
    if (!confirm("Excluir esta interação?")) return;
    await deleteInteractionAction(clientId, interactionId);
  }

  return (
    <div className="space-y-5">
      {/* Quick Note */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Anotação rápida... (ex: cliente ligou pedindo atualização)"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            rows={2}
            className="flex-1 resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleQuickNote();
              }
            }}
          />
          <Button
            size="sm"
            className="self-end"
            disabled={!quickNote.trim() || savingNote}
            onClick={handleQuickNote}
          >
            <Plus className="h-4 w-4 mr-1" />
            Salvar
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Ctrl+Enter para salvar rapidamente
        </p>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground mr-1">
          Registrar:
        </span>
        {(Object.keys(typeConfig) as InteractionTypeKey[]).map((type) => {
          const config = typeConfig[type];
          const Icon = config.icon;
          return (
            <Button
              key={type}
              variant={addingType === type ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setAddingType(addingType === type ? null : type)}
            >
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </Button>
          );
        })}

        <div className="flex-1" />

        {overdueCount > 0 && (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertCircle className="h-3 w-3" />
            {overdueCount} follow-up{overdueCount > 1 ? "s" : ""} atrasado
            {overdueCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Add Interaction Form */}
      {addingType && (
        <div className="bg-card border-2 border-primary/20 rounded-xl p-4">
          <form action={handleAdd} className="space-y-3">
            <input type="hidden" name="type" value={addingType} />
            <div className="flex items-center gap-2 mb-2">
              {(() => {
                const Icon = typeConfig[addingType].icon;
                return <Icon className="h-4 w-4 text-primary" />;
              })()}
              <span className="text-sm font-medium">
                Nova {typeConfig[addingType].label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="date"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
              <Input
                name="duration_minutes"
                type="number"
                placeholder="Duração (min)"
              />
            </div>
            <Textarea
              name="summary"
              placeholder="Resumo da interação *"
              required
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="outcome"
                placeholder="Resultado"
              />
              <Input
                name="next_steps"
                placeholder="Próximos passos"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="follow_up_date" type="date" />
              <Input
                name="follow_up_description"
                placeholder="Descrição do follow-up"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Salvar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAddingType(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex gap-1">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? "default" : "ghost"}
              size="sm"
              className="text-xs h-7 px-2.5"
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
              {opt.value !== "all" && (
                <span className="ml-1 text-[10px] opacity-60">
                  {interactions.filter((i) =>
                    opt.value === "all" ? true : i.type === opt.value
                  ).length}
                </span>
              )}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {filtered.length} interaç{filtered.length === 1 ? "ão" : "ões"}
        </span>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((interaction) => {
            const config = typeConfig[interaction.type as InteractionTypeKey];
            const Icon = config?.icon ?? FileText;
            const isOverdue =
              interaction.follow_up_date && interaction.follow_up_date < today;
            const isExpanded = expandedId === interaction.id;
            const hasDetails =
              interaction.outcome ||
              interaction.next_steps ||
              interaction.follow_up_description;

            return (
              <div
                key={interaction.id}
                className="bg-card border border-border rounded-xl overflow-hidden group"
              >
                {/* Main Row */}
                <div
                  className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : interaction.id)
                  }
                >
                  {/* Type Icon */}
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${config?.color ?? "bg-muted"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {config?.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(interaction.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {interaction.duration_minutes && (
                        <span className="text-xs text-muted-foreground">
                          · {interaction.duration_minutes} min
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-snug">{interaction.summary}</p>
                  </div>

                  {/* Right Side */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {interaction.follow_up_date && (
                      <Badge
                        variant={isOverdue ? "destructive" : "outline"}
                        className="text-[10px] px-1.5"
                      >
                        {isOverdue ? "Atrasado" : "Follow-up"}{" "}
                        {new Date(
                          interaction.follow_up_date + "T00:00:00"
                        ).toLocaleDateString("pt-BR")}
                      </Badge>
                    )}
                    {hasDetails &&
                      (isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(interaction.id);
                      }}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasDetails && (
                  <div className="px-3.5 pb-3.5 pt-0 ml-11 border-t border-border mt-0 pt-3 space-y-1.5">
                    {interaction.outcome && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">
                          Resultado:{" "}
                        </span>
                        {interaction.outcome}
                      </div>
                    )}
                    {interaction.next_steps && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">
                          Próximos passos:{" "}
                        </span>
                        {interaction.next_steps}
                      </div>
                    )}
                    {interaction.follow_up_description && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">
                          Follow-up:{" "}
                        </span>
                        {interaction.follow_up_description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            {filter !== "all"
              ? `Nenhuma ${filterOptions.find((f) => f.value === filter)?.label.toLowerCase() ?? "interação"} registrada.`
              : "Nenhuma interação registrada. Use os botões acima para começar."}
          </div>
        )}
      </div>
    </div>
  );
}
