import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils";

export default async function PortalProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const { data: fp } = await supabase
    .from("financial_profile")
    .select("*")
    .eq("client_id", client.id)
    .single();

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("client_id", client.id);

  const { data: liabilities } = await supabase
    .from("liabilities")
    .select("*")
    .eq("client_id", client.id);

  const totalAssets = (assets ?? []).reduce((s: number, a: any) => s + a.current_value, 0);
  const totalLiabilities = (liabilities ?? []).reduce((s: number, l: any) => s + l.remaining_amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Meu Perfil Financeiro</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Patrimonio liquido</p>
          <p className="text-xl font-semibold text-accent">{formatBRL(totalAssets - totalLiabilities)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Renda mensal</p>
          <p className="text-xl font-semibold">{formatBRL(fp?.monthly_income ?? 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Aporte mensal</p>
          <p className="text-xl font-semibold">{formatBRL(fp?.monthly_contribution ?? 0)}</p>
        </div>
      </div>

      {(assets?.length ?? 0) > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold">Ativos</h2>
          </div>
          <table className="w-full">
            <tbody>
              {assets?.map((a: any) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm">{a.name}</td>
                  <td className="p-4 text-sm text-right font-medium">{formatBRL(a.current_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(liabilities?.length ?? 0) > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold">Dividas</h2>
          </div>
          <table className="w-full">
            <tbody>
              {liabilities?.map((l: any) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm">{l.name}</td>
                  <td className="p-4 text-sm text-right font-medium">{formatBRL(l.remaining_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
