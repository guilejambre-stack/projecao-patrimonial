"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, UserCheck, UserX, Send, Search } from "lucide-react";
import { inviteClientToPortalAction } from "@/app/dashboard/clients/[id]/actions";
import { revokePortalAccessAction } from "./actions";

interface ClientRow {
  id: string;
  full_name: string;
  email: string | null;
  portal_user_id: string | null;
}

export function PermissionsManager({ clients }: { clients: ClientRow[] }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const withAccess = filtered.filter((c) => c.portal_user_id);
  const withoutAccess = filtered.filter((c) => !c.portal_user_id);

  async function handleInvite(clientId: string, email: string) {
    setLoading(clientId);
    setMessage(null);
    try {
      await inviteClientToPortalAction(clientId, email);
      setMessage({ type: "success", text: "Convite enviado com sucesso!" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message ?? "Erro ao enviar convite" });
    }
    setLoading(null);
  }

  async function handleRevoke(clientId: string) {
    if (!confirm("Revogar acesso ao portal deste cliente?")) return;
    setLoading(clientId);
    setMessage(null);
    try {
      await revokePortalAccessAction(clientId);
      setMessage({ type: "success", text: "Acesso revogado." });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message ?? "Erro ao revogar acesso" });
    }
    setLoading(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Permissões do Portal</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie quais clientes têm acesso ao portal para visualizar seus dados e projeções.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {withAccess.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            Com acesso ao portal ({withAccess.length})
          </h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Cliente</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {withAccess.map((client) => (
                  <tr key={client.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-sm font-medium">{client.full_name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{client.email ?? "—"}</td>
                    <td className="p-3">
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                        Ativo
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive gap-1"
                        onClick={() => handleRevoke(client.id)}
                        disabled={loading === client.id}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Revogar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <UserX className="h-4 w-4 text-muted-foreground" />
          Sem acesso ao portal ({withoutAccess.length})
        </h3>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Cliente</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Email</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {withoutAccess.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-sm font-medium">{client.full_name}</td>
                  <td className="p-3 text-sm text-muted-foreground">{client.email ?? "—"}</td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => client.email && handleInvite(client.id, client.email)}
                      disabled={!client.email || loading === client.id}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {loading === client.id ? "Enviando..." : "Convidar"}
                    </Button>
                  </td>
                </tr>
              ))}
              {withoutAccess.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-sm text-muted-foreground">
                    Todos os clientes já possuem acesso ao portal.
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
