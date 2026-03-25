"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatBRLCompact } from "@/lib/utils";
import { User, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ClientSummaryCardProps {
  id: string;
  fullName: string;
  phone: string | null;
  currentAssets: number;
  projectedWealth: number;
  wealthForIncome: number;
  hasPortalAccess: boolean;
}

export function ClientSummaryCard({
  id,
  fullName,
  phone,
  currentAssets,
  projectedWealth,
  wealthForIncome,
  hasPortalAccess,
}: ClientSummaryCardProps) {
  const gap = projectedWealth - wealthForIncome;
  const isGoalAchievable = gap >= 0;

  return (
    <Link
      href={`/dashboard/clients/${id}`}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium group-hover:text-primary transition-colors">{fullName}</p>
            <p className="text-xs text-muted-foreground">{phone ?? "Sem telefone"}</p>
          </div>
        </div>
        {hasPortalAccess && (
          <Badge variant="secondary" className="text-[10px]">Portal</Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Patrimônio</p>
          <p className="text-sm font-semibold">{formatBRLCompact(currentAssets)}</p>
        </div>
        <div className="flex items-center gap-1">
          {isGoalAchievable ? (
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
          ) : gap === 0 ? (
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={`text-xs font-medium ${isGoalAchievable ? "text-accent" : "text-destructive"}`}>
            {isGoalAchievable ? "Meta atingível" : "Revisão"}
          </span>
        </div>
      </div>
    </Link>
  );
}
