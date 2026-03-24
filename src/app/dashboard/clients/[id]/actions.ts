"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getClientById(id: string) {
  const supabase = await createClient();

  const [clientRes, fpRes, assetsRes, liabilitiesRes, scenarioRes] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("financial_profile").select("*").eq("client_id", id).single(),
      supabase.from("assets").select("*").eq("client_id", id).order("created_at"),
      supabase.from("liabilities").select("*").eq("client_id", id).order("created_at"),
      supabase.from("projection_scenarios").select("*").eq("client_id", id).eq("is_default", true).single(),
    ]);

  if (clientRes.error) throw clientRes.error;

  return {
    client: clientRes.data,
    financialProfile: fpRes.data,
    assets: assetsRes.data ?? [],
    liabilities: liabilitiesRes.data ?? [],
    scenario: scenarioRes.data,
  };
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      cpf: formData.get("cpf") as string,
      birth_date: formData.get("birth_date") as string || null,
      occupation: formData.get("occupation") as string,
      marital_status: formData.get("marital_status") as string || null,
      notes: formData.get("notes") as string,
    })
    .eq("id", clientId);

  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function updateFinancialProfileAction(
  clientId: string,
  data: Record<string, number | string>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("financial_profile")
    .update(data)
    .eq("client_id", clientId);

  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function upsertAssetAction(
  clientId: string,
  asset: { id?: string; category: string; name: string; current_value: number; monthly_yield_rate?: number; notes?: string }
) {
  const supabase = await createClient();

  if (asset.id) {
    const { error } = await supabase
      .from("assets")
      .update({ category: asset.category, name: asset.name, current_value: asset.current_value, monthly_yield_rate: asset.monthly_yield_rate, notes: asset.notes })
      .eq("id", asset.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("assets")
      .insert({ client_id: clientId, category: asset.category, name: asset.name, current_value: asset.current_value, monthly_yield_rate: asset.monthly_yield_rate, notes: asset.notes });
    if (error) throw error;
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function deleteAssetAction(clientId: string, assetId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", assetId);
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function upsertLiabilityAction(
  clientId: string,
  liability: { id?: string; name: string; total_amount: number; remaining_amount: number; monthly_payment: number; interest_rate: number; due_date?: string }
) {
  const supabase = await createClient();

  if (liability.id) {
    const { error } = await supabase
      .from("liabilities")
      .update({ name: liability.name, total_amount: liability.total_amount, remaining_amount: liability.remaining_amount, monthly_payment: liability.monthly_payment, interest_rate: liability.interest_rate, due_date: liability.due_date })
      .eq("id", liability.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("liabilities")
      .insert({ client_id: clientId, name: liability.name, total_amount: liability.total_amount, remaining_amount: liability.remaining_amount, monthly_payment: liability.monthly_payment, interest_rate: liability.interest_rate, due_date: liability.due_date });
    if (error) throw error;
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function deleteLiabilityAction(clientId: string, liabilityId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("liabilities").delete().eq("id", liabilityId);
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function updateScenarioAction(
  scenarioId: string,
  clientId: string,
  data: { cdi_rate: number; cdi_percentage: number; tax_rate: number; inflation_rate: number }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projection_scenarios")
    .update(data)
    .eq("id", scenarioId);
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function inviteClientToPortalAction(clientId: string, email: string) {
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("portal_user_id")
    .eq("id", clientId)
    .single();

  if (client?.portal_user_id) {
    throw new Error("Cliente ja possui acesso ao portal");
  }

  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    data: { role: "client", client_id: clientId },
  });

  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}
