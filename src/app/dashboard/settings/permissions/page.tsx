import { createClient } from "@/lib/supabase/server";
import { PermissionsManager } from "./permissions-manager";

export default async function PermissionsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, portal_user_id")
    .order("full_name");

  return <PermissionsManager clients={clients ?? []} />;
}
