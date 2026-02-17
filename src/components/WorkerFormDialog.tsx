import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useCreateWorker } from "@/hooks/useWorkers";
import { toast } from "sonner";

interface WorkerFormState {
  full_name: string;
  email: string;
  mobile_phone: string;
  whatsapp: string;
  cpf: string;
  cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_state: string;
  address_city: string;
  address_country: string;
  bond_type: string;
  status: string;
}

const initialForm: WorkerFormState = {
  full_name: "",
  email: "",
  mobile_phone: "",
  whatsapp: "",
  cpf: "",
  cep: "",
  address_street: "",
  address_number: "",
  address_complement: "",
  address_neighborhood: "",
  address_state: "",
  address_city: "",
  address_country: "Brasil",
  bond_type: "VOLUNTARIO",
  status: "ATIVO",
};

export default function WorkerFormDialog() {
  const createWorker = useCreateWorker();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WorkerFormState>({ ...initialForm });
  const [loadingCep, setLoadingCep] = useState(false);

  const updateField = (field: keyof WorkerFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCepBlur = async () => {
    const cepClean = form.cep.replace(/\D/g, "");
    if (cepClean.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setForm((prev) => ({
        ...prev,
        address_street: data.logradouro || "",
        address_neighborhood: data.bairro || "",
        address_city: data.localidade || "",
        address_state: data.uf || "",
        address_country: "Brasil",
      }));
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCreate = async () => {
    if (!form.full_name) {
      toast.error("Informe o nome do colaborador");
      return;
    }
    try {
      await createWorker.mutateAsync({
        full_name: form.full_name,
        email: form.email || undefined,
        mobile_phone: form.mobile_phone || undefined,
        whatsapp: form.whatsapp || undefined,
        cpf: form.cpf || undefined,
        cep: form.cep || undefined,
        address_street: form.address_street || undefined,
        address_number: form.address_number || undefined,
        address_complement: form.address_complement || undefined,
        address_neighborhood: form.address_neighborhood || undefined,
        address_state: form.address_state || undefined,
        address_city: form.address_city || undefined,
        address_country: form.address_country || undefined,
        bond_type: form.bond_type,
        status: form.status,
      } as any);
      toast.success("Colaborador cadastrado!");
      setForm({ ...initialForm });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao cadastrar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" />Novo Colaborador</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Colaborador</DialogTitle>
          <DialogDescription>Preencha os dados do novo colaborador</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Nome */}
          <div className="grid gap-2">
            <Label>Nome Completo *</Label>
            <Input placeholder="Nome do colaborador" value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
          </div>

          {/* Email + CPF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>CPF</Label>
              <Input placeholder="000.000.000-00" value={form.cpf} onChange={(e) => updateField("cpf", e.target.value)} />
            </div>
          </div>

          {/* Telefone + WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" value={form.mobile_phone} onChange={(e) => updateField("mobile_phone", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>WhatsApp</Label>
              <Input placeholder="(00) 00000-0000" value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} />
            </div>
          </div>

          {/* CEP + Endereço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>CEP</Label>
              <div className="relative">
                <Input placeholder="00000-000" value={form.cep} onChange={(e) => updateField("cep", e.target.value)} onBlur={handleCepBlur} />
                {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Endereço</Label>
              <Input placeholder="Rua, Avenida..." value={form.address_street} onChange={(e) => updateField("address_street", e.target.value)} />
            </div>
          </div>

          {/* Nº + Complemento + Bairro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Nº</Label>
              <Input placeholder="123" value={form.address_number} onChange={(e) => updateField("address_number", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Complemento</Label>
              <Input placeholder="Apto, Bloco..." value={form.address_complement} onChange={(e) => updateField("address_complement", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Bairro</Label>
              <Input placeholder="Bairro" value={form.address_neighborhood} onChange={(e) => updateField("address_neighborhood", e.target.value)} />
            </div>
          </div>

          {/* Cidade + Estado + País */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Cidade</Label>
              <Input placeholder="Cidade" value={form.address_city} onChange={(e) => updateField("address_city", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Input placeholder="UF" value={form.address_state} onChange={(e) => updateField("address_state", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>País</Label>
              <Input placeholder="País" value={form.address_country} onChange={(e) => updateField("address_country", e.target.value)} />
            </div>
          </div>

          {/* Vínculo + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Vínculo</Label>
              <Select value={form.bond_type} onValueChange={(v) => updateField("bond_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VOLUNTARIO">Voluntário</SelectItem>
                  <SelectItem value="CONTRATADO">Contratado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={createWorker.isPending}>
            {createWorker.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
