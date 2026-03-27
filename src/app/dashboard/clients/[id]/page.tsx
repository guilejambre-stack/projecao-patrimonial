import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getClientById } from "./actions";
import { PersonalTab } from "@/components/clients/personal-tab";
import { FinancialTab } from "@/components/clients/financial-tab";
import { ProjectionTab } from "@/components/clients/projection-tab";
import { GoalsTable } from "@/components/clients/goals-table";
import { InteractionsTab } from "@/components/clients/interactions-tab";

const statusLabels: Record<string, string> = {
  prospect: "Prospecto",
  consultation: "Consulta",
  proposal: "Proposta",
  active: "Ativo",
  inactive: "Inativo",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  prospect: "secondary",
  consultation: "outline",
  proposal: "default",
  active: "default",
  inactive: "destructive",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getClientById(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold">{data.client.full_name}</h1>
        <Badge variant={statusVariants[data.client.pipeline_status] ?? "secondary"} className="text-xs">
          {statusLabels[data.client.pipeline_status] ?? "Prospecto"}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {data.client.occupation ?? "Sem ocupação"} · {data.client.email ?? "Sem email"}
      </p>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="gap-1">
          <TabsTrigger value="personal" className="text-xs px-3 py-1.5">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs px-3 py-1.5">Perfil Financeiro</TabsTrigger>
          <TabsTrigger value="projection" className="text-xs px-3 py-1.5">Projeção Patrimonial</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs px-3 py-1.5">Metas</TabsTrigger>
          <TabsTrigger value="interactions" className="text-xs px-3 py-1.5">CRM</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalTab client={data.client} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialTab
            client={data.client}
            financialProfile={data.financialProfile}
            assets={data.assets}
            liabilities={data.liabilities}
            insurance={data.insurance}
          />
        </TabsContent>

        <TabsContent value="projection">
          <ProjectionTab
            client={data.client}
            financialProfile={data.financialProfile}
            scenario={data.scenario}
            scenarios={data.scenarios}
            assets={data.assets}
            liabilities={data.liabilities}
          />
        </TabsContent>

        <TabsContent value="goals">
          <GoalsTable clientId={data.client.id} goals={data.goals} />
        </TabsContent>

        <TabsContent value="interactions">
          <InteractionsTab clientId={data.client.id} interactions={data.interactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
