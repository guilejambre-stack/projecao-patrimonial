"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getClients(search?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select(`
      *,
      financial_profile (current_assets, monthly_contribution),
      projection_scenarios (cdi_rate, cdi_percentage, tax_rate, inflation_rate, is_default)
    `)
    .order("updated_at", { ascending: false });

  if (search) {
    query = query.ilike("full_name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      planner_id: user.id,
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      cpf: formData.get("cpf") as string,
      birth_date: formData.get("birth_date") as string || null,
      occupation: formData.get("occupation") as string,
      marital_status: formData.get("marital_status") as string || null,
      notes: formData.get("notes") as string,
    })
    .select()
    .single();

  if (error) throw error;

  // Create default financial_profile
  await supabase.from("financial_profile").insert({ client_id: client.id });

  // Create default projection scenario
  await supabase.from("projection_scenarios").insert({ client_id: client.id });

  revalidatePath("/dashboard/clients");
  return client;
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard/clients");
}
