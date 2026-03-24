interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueClassName?: string;
}

export function MetricCard({ label, value, subtitle, valueClassName }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-base font-semibold tracking-tight ${valueClassName ?? ""}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
