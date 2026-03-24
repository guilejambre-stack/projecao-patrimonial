"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

const tabs = [
  { href: "/portal/profile", label: "Meu Perfil" },
  { href: "/portal/projection", label: "Minha Projecao" },
];

export function PortalTopbar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold">Pranej Fin</span>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  pathname === tab.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile.full_name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
