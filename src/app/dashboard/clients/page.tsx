import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getClients } from "./actions";
import { formatBRLCompact } from "@/lib/utils";

const pipelineFilters = [
  { value: "all", label: "Todos" },
  { value: "prospect", label: "Prospecto" },
  { value: "consultation", label: "Consulta" },
  { value: "proposal", label: "Proposta" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  prospect: "secondary",
  consultation: "outline",
  proposal: "default",
  active: "default",
  inactive: "destructive",
};

const statusLabels: Record<string, string> = {
  prospect: "Prospecto",
  consultation: "Consulta",
  proposal: "Proposta",
  active: "Ativo",
  inactive: "Inativo",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const clients = await getClients(q, status);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Link href="/dashboard/clients/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <form className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar cliente..."
              defaultValue={q}
              className="pl-9"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </div>
        </form>

        <div className="flex items-center gap-1">
          {pipelineFilters.map((filter) => {
            const isActive = (status ?? "all") === filter.value;
            return (
              <Link
                key={filter.value}
                href={`/dashboard/clients?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(filter.value !== "all" ? { status: filter.value } : {}),
                }).toString()}`}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 px-2.5"
                >
                  {filter.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Nome</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Telefone</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Patrimônio</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Última Interação</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Portal</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client: any) => (
              <tr key={client.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                <td className="p-4">
                  <Link href={`/dashboard/clients/${client.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                    {client.full_name}
                  </Link>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{client.phone ?? "—"}</td>
                <td className="p-4">
                  <Badge variant={statusVariants[client.pipeline_status] ?? "secondary"} className="text-xs">
                    {statusLabels[client.pipeline_status] ?? "Prospecto"}
                  </Badge>
                </td>
                <td className="p-4 text-sm font-medium">
                  {formatBRLCompact(client.financial_profile?.current_assets ?? 0)}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {client.last_interaction
                    ? new Date(client.last_interaction.date).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td className="p-4">
                  <Badge variant={client.portal_user_id ? "default" : "secondary"} className="text-xs">
                    {client.portal_user_id ? "Ativo" : "Sem acesso"}
                  </Badge>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                  {q || status ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
