"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getClientById(id: string) {
  const supabase = await createClient();

  const [clientRes, fpRes, assetsRes, liabilitiesRes, scenariosRes, goalsRes, insuranceRes, interactionsRes] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("financial_profile").select("*").eq("client_id", id).single(),
      supabase.from("assets").select("*").eq("client_id", id).order("created_at"),
      supabase.from("liabilities").select("*").eq("client_id", id).order("created_at"),
      supabase.from("projection_scenarios").select("*").eq("client_id", id).order("is_default", { ascending: false }),
      supabase.from("goals").select("*").eq("client_id", id).order("priority"),
      supabase.from("insurance").select("*").eq("client_id", id).order("created_at"),
      supabase.from("interactions").select("*").eq("client_id", id).order("date", { ascending: false }),
    ]);

  if (clientRes.error) throw clientRes.error;

  const scenarios = scenariosRes.data ?? [];
  const defaultScenario = scenarios.find((s: any) => s.is_default) ?? scenarios[0] ?? null;

  return {
    client: clientRes.data,
    financialProfile: fpRes.data,
    assets: assetsRes.data ?? [],
    liabilities: liabilitiesRes.data ?? [],
    scenario: defaultScenario,
    scenarios,
    goals: goalsRes.data ?? [],
    insurance: insuranceRes.data ?? [],
    interactions: interactionsRes.data ?? [],
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
      pipeline_status: formData.get("pipeline_status") as string || "prospect",
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

// Scenario management
export async function createScenarioAction(clientId: string, data: { name: string; cdi_rate: number; cdi_percentage: number; tax_rate: number; inflation_rate: number }) {
  const supabase = await createClient();
  const { error } = await supabase.from("projection_scenarios").insert({ client_id: clientId, ...data, is_default: false });
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function deleteScenarioAction(clientId: string, scenarioId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projection_scenarios").delete().eq("id", scenarioId).eq("client_id", clientId);
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

// Goals management
export async function upsertGoalAction(clientId: string, data: { name: string; target_amount: number; target_date?: string; priority?: string; category?: string; notes?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert({ client_id: clientId, ...data });
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function deleteGoalAction(clientId: string, goalId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", goalId).eq("client_id", clientId);
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

// Insurance management
export async function upsertInsuranceAction(clientId: string, data: { type: string; provider: string; policy_number?: string; coverage_amount: number; monthly_premium: number; expiry_date?: string; beneficiary?: string; notes?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("insurance").insert({ client_id: clientId, ...data });
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function deleteInsuranceAction(clientId: string, insuranceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("insurance").delete().eq("id", insuranceId).eq("client_id", clientId);
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

// Interactions management
export async function upsertInteractionAction(
  clientId: string,
  data: {
    type: string;
    date: string;
    duration_minutes?: number;
    summary: string;
    next_steps?: string;
    outcome?: string;
    follow_up_date?: string;
    follow_up_description?: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("interactions").insert({
    client_id: clientId,
    ...data,
    duration_minutes: data.duration_minutes || null,
    next_steps: data.next_steps || null,
    outcome: data.outcome || null,
    follow_up_date: data.follow_up_date || null,
    follow_up_description: data.follow_up_description || null,
  });
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function deleteInteractionAction(clientId: string, interactionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("interactions").delete().eq("id", interactionId).eq("client_id", clientId);
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
