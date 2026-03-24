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
import type { Client } from "@/types";

export function PersonalTab({ client }: { client: Client }) {
  async function handleSave(formData: FormData) {
    await updateClientAction(client.id, formData);
  }

  async function handleInvite() {
    if (!client.email) return;
    await inviteClientToPortalAction(client.id, client.email);
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
            <Label htmlFor="occupation">Ocupacao</Label>
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
                <SelectItem value="widowed">Viuvo(a)</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Observacoes</Label>
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
        </div>
      </form>
    </div>
  );
}
