import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalProjectionView } from "./portal-projection-view";

export default async function PortalProjectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const [fpRes, scenarioRes] = await Promise.all([
    supabase.from("financial_profile").select("*").eq("client_id", client.id).single(),
    supabase.from("projection_scenarios").select("*").eq("client_id", client.id).eq("is_default", true).single(),
  ]);

  return (
    <PortalProjectionView
      client={client}
      financialProfile={fpRes.data}
      scenario={scenarioRes.data}
    />
  );
}
