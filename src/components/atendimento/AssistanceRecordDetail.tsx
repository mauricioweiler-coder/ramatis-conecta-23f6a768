import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Clock, AlertCircle, CheckCircle, User, FileText, ArrowRight, CalendarCheck, Phone, MapPin, CreditCard } from "lucide-react";
import type { AssistanceRecord } from "@/hooks/useAssistanceRecords";
import { useUpdateAssistanceRecord } from "@/hooks/useAssistanceRecords";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useToast } from "@/hooks/use-toast";

const statusMap: Record<string, string> = {
  AGENDADO: "Agendado",
  AGUARDANDO: "Aguardando",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

const statusColor: Record<string, string> = {
  Agendado: "bg-accent/10 text-accent-foreground border-border",
  Aguardando: "bg-destructive/10 text-destructive border-destructive/20",
  "Em andamento": "bg-primary/10 text-primary border-primary/20",
  Concluído: "bg-muted text-muted-foreground border-border",
};

const statusIcon: Record<string, typeof Clock> = {
  Agendado: CalendarCheck,
  Aguardando: AlertCircle,
  "Em andamento": Clock,
  Concluído: CheckCircle,
};

const statusKeys = ["AGENDADO", "AGUARDANDO", "EM_ANDAMENTO", "CONCLUIDO"];

interface Props {
  record: AssistanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssistanceRecordDetail({ record, open, onOpenChange }: Props) {
  const [status, setStatus] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [referral, setReferral] = useState("");
  const [observations, setObservations] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const update = useUpdateAssistanceRecord();
  const { data: individualTypes = [] } = useServiceTypes(true, "individual");
  const { toast } = useToast();

  useEffect(() => {
    if (record) {
      setStatus(record.status || "AGENDADO");
      setInterviewer(record.interviewer_name || "");
      setReferral(record.referral || "");
      setObservations(record.observations || "");
      setPhone(record.phone || "");
      setEmail(record.email || "");
      setAddress(record.address || "");
    }
  }, [record]);

  if (!record) return null;

  const displayStatus = statusMap[status] || "Agendado";
  const Icon = statusIcon[displayStatus] || CalendarCheck;
  const createdAt = new Date(record.created_at);
  const isAgendado = status === "AGENDADO";

  const handleSave = () => {
    update.mutate(
      {
        id: record.id,
        status,
        interviewer_name: interviewer || null,
        referral: referral || null,
        observations: observations || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Atendimento atualizado!" });
          onOpenChange(false);
        },
        onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Ficha de Atendimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-lg">{record.visitor_name}</h3>
              <Badge variant="outline" className={statusColor[displayStatus]}>
                <Icon className="mr-1 h-3 w-3" />{displayStatus}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {createdAt.toLocaleDateString("pt-BR")} às {createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {record.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {record.phone}
                </span>
              )}
            </div>
            {record.symptom && (
              <div className="pt-1">
                <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                  <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {record.symptom}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Dados do atendido — preenchidos quando a pessoa chega */}
          {isAgendado && (
            <>
              <div className="rounded-lg border border-border bg-accent/5 p-4 space-y-1">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Dados do Atendido
                </h4>
                <p className="text-xs text-muted-foreground">
                  Preencha os dados quando a pessoa chegar na casa. Ao salvar, o status será alterado para "Aguardando".
                </p>
              </div>
            </>
          )}

          {/* Editable fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusKeys.map((k) => (
                    <SelectItem key={k} value={k}>{statusMap[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone
                </Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Endereço
              </Label>
              <Input
                placeholder="Endereço completo"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label>Entrevistador</Label>
              <Input
                placeholder="Nome do entrevistador"
                value={interviewer}
                onChange={(e) => setInterviewer(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" />
                Encaminhamento
              </Label>
              <Select value={referral} onValueChange={setReferral}>
                <SelectTrigger><SelectValue placeholder="Selecione o encaminhamento" /></SelectTrigger>
                <SelectContent>
                  {individualTypes.map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações do atendimento..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={update.isPending}>
              {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
