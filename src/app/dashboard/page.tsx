import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KPICard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { formatBRLCompact } from "@/lib/utils";

const pipelineStages = [
  { key: "prospect", label: "Prospecto", color: "bg-slate-400" },
  { key: "consultation", label: "Consulta", color: "bg-blue-400" },
  { key: "proposal", label: "Proposta", color: "bg-amber-400" },
  { key: "active", label: "Ativo", color: "bg-emerald-500" },
  { key: "inactive", label: "Inativo", color: "bg-red-400" },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const [clientsRes, followUpsRes] = await Promise.all([
    supabase
      .from("clients")
      .select(`
        id, full_name, updated_at, portal_user_id, pipeline_status,
        financial_profile (current_assets, desired_retirement_income, social_security_income, other_income, monthly_contribution, retirement_age, life_expectancy)
      `)
      .order("full_name", { ascending: true }),
    supabase
      .from("interactions")
      .select("id, follow_up_date, follow_up_description, summary, type, client_id, clients(full_name)")
      .not("follow_up_date", "is", null)
      .gte("follow_up_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
      .order("follow_up_date", { ascending: true })
      .limit(10),
  ]);

  const allClients = clientsRes.data ?? [];
  const followUps = followUpsRes.data ?? [];
  const totalClients = allClients.length;
  const today = new Date().toISOString().slice(0, 10);

  const totalAssets = allClients.reduce(
    (sum, c: any) => sum + (c.financial_profile?.current_assets ?? 0),
    0
  );

  // Pipeline counts
  const pipelineCounts: Record<string, number> = {};
  for (const stage of pipelineStages) {
    pipelineCounts[stage.key] = allClients.filter(
      (c: any) => (c.pipeline_status ?? "prospect") === stage.key
    ).length;
  }
  const maxPipelineCount = Math.max(...Object.values(pipelineCounts), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Painel</h1>

      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Total de clientes"
          value={String(totalClients)}
          accentColor="blue"
        />
        <KPICard
          label="Patrimonio sob gestao"
          value={formatBRLCompact(totalAssets)}
          accentColor="green"
        />
        <KPICard
          label="Clientes ativos no portal"
          value={String(allClients.filter((c: any) => c.portal_user_id).length)}
          accentColor="amber"
        />
      </div>

      {/* Pipeline Overview */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold">Funil de Clientes</h2>
        </div>
        <div className="p-5 space-y-3">
          {pipelineStages.map((stage) => {
            const count = pipelineCounts[stage.key];
            const pct = (count / maxPipelineCount) * 100;
            return (
              <Link
                key={stage.key}
                href={`/dashboard/clients?status=${stage.key}`}
                className="flex items-center gap-3 group"
              >
                <span className="text-xs text-muted-foreground w-20 text-right group-hover:text-foreground transition-colors">
                  {stage.label}
                </span>
                <div className="flex-1 h-7 bg-secondary/50 rounded-md overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-md transition-all flex items-center px-2.5`}
                    style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                  >
                    {count > 0 && (
                      <span className="text-xs font-semibold text-white">
                        {count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Follow-ups Widget */}
      {followUps.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Próximos Follow-ups</h2>
          </div>
          <div className="divide-y divide-border">
            {followUps.map((f: any) => {
              const isOverdue = f.follow_up_date < today;
              return (
                <Link
                  key={f.id}
                  href={`/dashboard/clients/${f.client_id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{f.clients?.full_name}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-xs">
                      {f.follow_up_description || f.summary}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOverdue && <Badge variant="destructive" className="text-xs">Atrasado</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(f.follow_up_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold">Clientes</h2>
        </div>
        <div className="divide-y divide-border">
          {allClients.map((client: any) => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
            >
              <span className="text-sm font-medium">{client.full_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatBRLCompact(client.financial_profile?.current_assets ?? 0)}
              </span>
            </Link>
          ))}
          {allClients.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhum cliente cadastrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
