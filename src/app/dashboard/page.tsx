import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KPICard } from "@/components/kpi-card";
import { formatBRLCompact } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select(`
      id, full_name, updated_at, portal_user_id,
      financial_profile (current_assets, desired_retirement_income, social_security_income, other_income, monthly_contribution, retirement_age, life_expectancy)
    `)
    .order("full_name", { ascending: true });

  const allClients = clients ?? [];
  const totalClients = allClients.length;

  const totalAssets = allClients.reduce(
    (sum, c: any) => sum + (c.financial_profile?.current_assets ?? 0),
    0
  );

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
