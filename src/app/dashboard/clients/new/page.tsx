"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientAction } from "../actions";

export default function NewClientPage() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const client = await createClientAction(formData);
    router.push(`/dashboard/clients/${client.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Novo Cliente</h1>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birth_date">Data de nascimento</Label>
            <Input id="birth_date" name="birth_date" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="occupation">Ocupacao</Label>
            <Input id="occupation" name="occupation" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="marital_status">Estado civil</Label>
            <Select name="marital_status">
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
          <Textarea id="notes" name="notes" rows={3} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit">Criar Cliente</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
