"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { formatReportAsCSV, type ReportData } from "@/lib/report-generator";
import { formatBRL } from "@/lib/utils";
import type { Client, FinancialProfile, Asset, Liability, ProjectionScenario } from "@/types";

interface ExportButtonsProps {
  client: Client;
  financialProfile: FinancialProfile | null;
  assets: Asset[];
  liabilities: Liability[];
  scenario: ProjectionScenario | null;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ client, financialProfile, assets, liabilities, scenario }: ExportButtonsProps) {
  const reportData: ReportData = {
    client,
    financialProfile,
    assets,
    liabilities,
    scenario,
    generatedAt: new Date().toLocaleDateString("pt-BR"),
  };

  function handleExportCSV() {
    const csv = formatReportAsCSV(reportData);
    const safeName = client.full_name.replace(/[^a-zA-Z0-9]/g, "_");
    downloadFile(csv, `relatorio_${safeName}_${new Date().toISOString().split("T")[0]}.csv`, "text/csv");
  }

  function handleExportJSON() {
    const json = JSON.stringify(reportData, null, 2);
    const safeName = client.full_name.replace(/[^a-zA-Z0-9]/g, "_");
    downloadFile(json, `dados_${safeName}_${new Date().toISOString().split("T")[0]}.json`, "application/json");
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Exportar CSV
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportJSON}>
        <Download className="h-3.5 w-3.5" />
        Exportar JSON
      </Button>
    </div>
  );
}
