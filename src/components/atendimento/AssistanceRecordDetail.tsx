import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, Clock, AlertCircle, CheckCircle, User, FileText,
  ArrowRight, CalendarCheck, Phone, MapPin, Search, Plus, History,
} from "lucide-react";
import type { AssistanceRecord } from "@/hooks/useAssistanceRecords";
import { useUpdateAssistanceRecord, useCreateAssistanceRecord } from "@/hooks/useAssistanceRecords";
import { useSearchAtendidoByCpf, useCreateAtendido, useUpdateAtendido, useAtendidoHistory } from "@/hooks/useAtendidos";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useWorkersList } from "@/hooks/useWorkers";
import { useToast } from "@/hooks/use-toast";

const statusMap: Record<string, string> = {
  AGENDADO: "Agendado",
  AGUARDANDO: "Presente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

const statusColor: Record<string, string> = {
  Agendado: "bg-accent/10 text-accent-foreground border-border",
  Presente: "bg-destructive/10 text-destructive border-destructive/20",
  "Em andamento": "bg-primary/10 text-primary border-primary/20",
  Concluído: "bg-muted text-muted-foreground border-border",
};

const statusIcon: Record<string, typeof Clock> = {
  Agendado: CalendarCheck,
  Presente: AlertCircle,
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
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [atendidoId, setAtendidoId] = useState<string | null>(null);
  const [cpfSearched, setCpfSearched] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpReferral, setFollowUpReferral] = useState("");

  const update = useUpdateAssistanceRecord();
  const createRecord = useCreateAssistanceRecord();
  const createAtendido = useCreateAtendido();
  const updateAtendido = useUpdateAtendido();
  const { data: individualTypes = [] } = useServiceTypes(true, "individual");
  const { data: foundAtendido, isFetching: searchingCpf } = useSearchAtendidoByCpf(cpfSearched ? cpf : "");
  const { data: history = [] } = useAtendidoHistory(atendidoId);
  const { data: workers = [] } = useWorkersList();
  const { toast } = useToast();

  // Get current record's referral service type level
  const currentServiceType = individualTypes.find((t) => t.name === (record?.referral || referral));
  const currentLevel = currentServiceType?.level || 1;
  // Filter follow-up types: same level or +1
  const followUpTypes = individualTypes.filter((t) => t.level >= currentLevel && t.level <= currentLevel + 1);

  useEffect(() => {
    if (record) {
      setStatus(record.status || "AGENDADO");
      setInterviewer(record.interviewer_name || "");
      setReferral(record.referral || "");
      setObservations(record.observations || "");
      setPhone(record.phone || "");
      setEmail(record.email || "");
      setAddress(record.address || "");
      setName(record.visitor_name || "");
      setAtendidoId(record.atendido_id || null);
      setCpf("");
      setCpfSearched(false);
      setShowFollowUp(false);
      setFollowUpDate("");
      setFollowUpReferral("");
    }
  }, [record]);

  // When CPF search returns a result, pre-fill fields
  useEffect(() => {
    if (foundAtendido && cpfSearched) {
      setName(foundAtendido.name);
      setPhone(foundAtendido.phone || "");
      setEmail(foundAtendido.email || "");
      setAddress(foundAtendido.address || "");
      setAtendidoId(foundAtendido.id);
      toast({ title: "Atendido encontrado! Dados preenchidos." });
    }
  }, [foundAtendido, cpfSearched]);

  if (!record) return null;

  const displayStatus = statusMap[status] || "Agendado";
  const Icon = statusIcon[displayStatus] || CalendarCheck;
  const createdAt = new Date(record.created_at);
  const isAgendado = status === "AGENDADO";

  const handleCpfSearch = () => {
    const clean = cpf.replace(/\D/g, "");
    if (clean.length < 11) {
      toast({ title: "Informe um CPF válido (11 dígitos)", variant: "destructive" });
      return;
    }
    setCpfSearched(true);
  };

  const handleSave = async () => {
    // If AGENDADO and we have CPF data, save/update atendido and link
    let finalAtendidoId = atendidoId;
    const cleanCpf = cpf.replace(/\D/g, "");

    if (isAgendado && cleanCpf.length >= 11) {
      try {
        if (foundAtendido) {
          // Update existing atendido
          await updateAtendido.mutateAsync({
            id: foundAtendido.id,
            name,
            phone: phone || null,
            email: email || null,
            address: address || null,
            cpf: cleanCpf,
          });
          finalAtendidoId = foundAtendido.id;
        } else {
          // Create new atendido
          const newAtendido = await createAtendido.mutateAsync({
            name,
            phone: phone || null,
            email: email || null,
            address: address || null,
            cpf: cleanCpf,
          });
          finalAtendidoId = newAtendido.id;
        }
      } catch {
        toast({ title: "Erro ao salvar dados do atendido", variant: "destructive" });
        return;
      }
    }

    // If transitioning from AGENDADO with atendido data, set to AGUARDANDO
    const finalStatus = isAgendado && finalAtendidoId ? "AGUARDANDO" : status;

    update.mutate(
      {
        id: record.id,
        status: finalStatus,
        interviewer_name: interviewer || null,
        referral: referral || null,
        observations: observations || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        atendido_id: finalAtendidoId,
        visitor_name: name,
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

  const handleCreateFollowUp = () => {
    if (!followUpDate) {
      toast({ title: "Informe a data do próximo atendimento", variant: "destructive" });
      return;
    }

    createRecord.mutate(
      {
        visitor_name: name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        symptom: record.symptom,
        referral: followUpReferral || referral || null,
        observations: `Encaminhamento do atendimento de ${createdAt.toLocaleDateString("pt-BR")}. Responsável anterior: ${interviewer || "—"}`,
        status: "AGENDADO",
        atendido_id: atendidoId,
        linked_previous_id: record.id,
        interviewer_name: null,
      },
      {
        onSuccess: () => {
          toast({ title: "Novo atendimento agendado!" });
          setShowFollowUp(false);
          onOpenChange(false);
        },
        onError: () => toast({ title: "Erro ao agendar", variant: "destructive" }),
      }
    );
  };

  // Filter history to exclude current record
  const previousRecords = history.filter((h) => h.id !== record.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* CPF Search — only when AGENDADO and not yet linked */}
          {isAgendado && !atendidoId && (
            <div className="rounded-lg border border-border bg-accent/5 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Search className="h-4 w-4" />
                Identificação do Atendido
              </h4>
              <p className="text-xs text-muted-foreground">
                Insira o CPF para buscar ou cadastrar o atendido. Ao salvar, o status será alterado para "Presente".
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => { setCpf(e.target.value); setCpfSearched(false); }}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleCpfSearch} disabled={searchingCpf}>
                  {searchingCpf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {cpfSearched && !searchingCpf && !foundAtendido && cpf.replace(/\D/g, "").length >= 11 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum cadastro encontrado. Preencha os dados abaixo para criar um novo registro.
                </p>
              )}
            </div>
          )}

          {/* Atendido linked indicator */}
          {atendidoId && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">Atendido vinculado</span>
              {cpf && <Badge variant="outline" className="ml-auto">CPF: {cpf.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</Badge>}
            </div>
          )}

          {/* Editable fields */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone
                </Label>
                <Input placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Endereço
              </Label>
              <Input placeholder="Endereço completo" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label>Entrevistador / Responsável</Label>
              <Select value={interviewer} onValueChange={setInterviewer}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o trabalhador" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.full_name}>
                      {w.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectItem key={t.id} value={t.name}>
                      {t.name} <span className="text-muted-foreground ml-1">(Nível {t.level})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea placeholder="Observações do atendimento..." value={observations} onChange={(e) => setObservations(e.target.value)} rows={3} />
            </div>
          </div>

          {/* History */}
          {previousRecords.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <History className="h-4 w-4" />
                  Histórico de Atendimentos ({previousRecords.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {previousRecords.map((h) => {
                    const hStatus = statusMap[h.status || "AGENDADO"] || "Agendado";
                    return (
                      <Card key={h.id} className="border-border">
                        <CardContent className="p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {new Date(h.created_at).toLocaleDateString("pt-BR")}
                            </span>
                            <Badge variant="outline" className={statusColor[hStatus]}>
                              {hStatus}
                            </Badge>
                          </div>
                          {h.referral && (
                            <p className="text-xs text-muted-foreground">Encaminhamento: {h.referral}</p>
                          )}
                          {h.interviewer_name && (
                            <p className="text-xs text-muted-foreground">Responsável: {h.interviewer_name}</p>
                          )}
                          {h.observations && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{h.observations}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Follow-up section */}
          {(status === "EM_ANDAMENTO" || status === "CONCLUIDO") && !showFollowUp && (
            <Button variant="outline" className="w-full" onClick={() => setShowFollowUp(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Atendimento (encaminhamento)
            </Button>
          )}

          {showFollowUp && (
            <>
              <Separator />
              <div className="rounded-lg border border-border bg-accent/5 p-4 space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  Agendar Próximo Atendimento
                </h4>
                <p className="text-xs text-muted-foreground">
                  As informações do atendido e o histórico serão levados para o próximo atendimento.
                </p>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Data do próximo atendimento *</Label>
                    <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Encaminhamento (mesmo nível ou +1)</Label>
                    <Select value={followUpReferral} onValueChange={setFollowUpReferral}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {followUpTypes.map((t) => (
                          <SelectItem key={t.id} value={t.name}>
                            {t.name} (Nível {t.level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowFollowUp(false)}>Cancelar</Button>
                  <Button onClick={handleCreateFollowUp} disabled={createRecord.isPending}>
                    {createRecord.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Agendar
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={update.isPending || createAtendido.isPending || updateAtendido.isPending}>
              {(update.isPending || createAtendido.isPending || updateAtendido.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
