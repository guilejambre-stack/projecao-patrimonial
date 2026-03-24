import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import type { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.role !== "planner") redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-60">
        <Topbar profile={profile} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
