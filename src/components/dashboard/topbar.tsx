"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import type { Profile } from "@/types";

export function Topbar({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="text-sm text-muted-foreground">
        Planejamento Financeiro
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary transition-colors outline-none">
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs bg-secondary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {profile.full_name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
