"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateClientAction, inviteClientToPortalAction } from "@/app/dashboard/clients/[id]/actions";
import { deleteClientAction } from "@/app/dashboard/clients/actions";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Client } from "@/types";

export function PersonalTab({ client }: { client: Client }) {
  const router = useRouter();

  async function handleSave(formData: FormData) {
    await updateClientAction(client.id, formData);
  }

  async function handleInvite() {
    if (!client.email) return;
    await inviteClientToPortalAction(client.id, client.email);
  }

  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.full_name}"? Esta ação não pode ser desfeita.`)) return;
    await deleteClientAction(client.id);
    router.push("/dashboard/clients");
  }

  return (
    <div className="max-w-2xl">
      <form action={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" name="full_name" defaultValue={client.full_name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={client.email ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={client.phone ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" defaultValue={client.cpf ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birth_date">Data de nascimento</Label>
            <Input id="birth_date" name="birth_date" type="date" defaultValue={client.birth_date ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="occupation">Ocupação</Label>
            <Input id="occupation" name="occupation" defaultValue={client.occupation ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="marital_status">Estado civil</Label>
            <Select name="marital_status" defaultValue={client.marital_status ?? undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Solteiro(a)</SelectItem>
                <SelectItem value="married">Casado(a)</SelectItem>
                <SelectItem value="divorced">Divorciado(a)</SelectItem>
                <SelectItem value="widowed">Viúvo(a)</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={client.notes ?? ""} />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit">Salvar</Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleInvite}
            disabled={!client.email || !!client.portal_user_id}
          >
            {client.portal_user_id ? "Portal ativo" : "Convidar ao Portal"}
          </Button>
          {client.portal_user_id && (
            <Badge variant="default" className="text-xs">Portal ativo</Badge>
          )}
          <div className="flex-1" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir Cliente
          </Button>
        </div>
      </form>
    </div>
  );
}
