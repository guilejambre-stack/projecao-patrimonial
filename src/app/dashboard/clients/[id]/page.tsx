import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientById } from "./actions";
import { PersonalTab } from "@/components/clients/personal-tab";
import { FinancialTab } from "@/components/clients/financial-tab";
import { ProjectionTab } from "@/components/clients/projection-tab";

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
      <h1 className="text-xl font-semibold mb-1">{data.client.full_name}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {data.client.occupation ?? "Sem ocupacao"} · {data.client.email ?? "Sem email"}
      </p>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="financial">Perfil Financeiro</TabsTrigger>
          <TabsTrigger value="projection">Projecao Patrimonial</TabsTrigger>
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
          />
        </TabsContent>

        <TabsContent value="projection">
          <ProjectionTab
            client={data.client}
            financialProfile={data.financialProfile}
            scenario={data.scenario}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
