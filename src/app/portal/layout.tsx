import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { PortalTopbar } from "./portal-topbar";

export default async function PortalLayout({
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

  if (!profile || profile.role !== "client") redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <PortalTopbar profile={profile} />
      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
}
