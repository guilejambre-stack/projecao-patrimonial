import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBRL(value: number | null): string {
  if (value == null) return "\u2014";
  return "R$ " + Math.round(value).toLocaleString("pt-BR");
}

export function formatBRLCompact(value: number | null): string {
  if (value == null) return "\u2014";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e6) return sign + "R$ " + (abs / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return sign + "R$ " + Math.round(abs / 1e3) + "k";
  return sign + "R$ " + Math.round(abs);
}

export function formatPercent(value: number, decimals = 2): string {
  return value.toFixed(decimals) + "%";
}
