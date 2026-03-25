import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getClients } from "./actions";
import { formatBRLCompact } from "@/lib/utils";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await getClients(q);

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

      <form className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Buscar cliente..."
            defaultValue={q}
            className="pl-9"
          />
        </div>
      </form>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Nome</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Telefone</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Patrimônio</th>
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
                <td className="p-4 text-sm font-medium">
                  {formatBRLCompact(client.financial_profile?.current_assets ?? 0)}
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
                <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                  {q ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
