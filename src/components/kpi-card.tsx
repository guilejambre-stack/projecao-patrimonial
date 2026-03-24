import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  accentColor: "blue" | "green" | "red" | "amber";
}

const accentMap = {
  blue: { bar: "bg-primary", value: "text-primary" },
  green: { bar: "bg-accent", value: "text-accent" },
  red: { bar: "bg-destructive", value: "text-destructive" },
  amber: { bar: "bg-amber-500", value: "text-amber-500" },
};

export function KPICard({ label, value, subtitle, accentColor }: KPICardProps) {
  const colors = accentMap[accentColor];

  return (
    <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-sm">
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 rounded-t-xl", colors.bar)} />
      <p className="text-xs text-muted-foreground font-medium mb-1.5">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight", colors.value)}>{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
