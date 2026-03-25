"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function revokePortalAccessAction(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ portal_user_id: null })
    .eq("id", clientId);

  if (error) throw error;
  revalidatePath("/dashboard/settings/permissions");
}
