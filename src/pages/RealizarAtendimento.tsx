import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, ArrowLeft, User, Phone, MapPin, Mail, FileText,
  ArrowRight, Clock, CheckCircle, History, Plus, CalendarCheck,
} from "lucide-react";
import { useAssistanceRecords, useUpdateAssistanceRecord, useCreateAssistanceRecord } from "@/hooks/useAssistanceRecords";
import { useAtendidoHistory } from "@/hooks/useAtendidos";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useToast } from "@/hooks/use-toast";

const statusMap: Record<string, string> = {
  AGENDADO: "Agendado",
  AGUARDANDO: "Presente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

export default function RealizarAtendimento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: records = [], isLoading } = useAssistanceRecords();
  const update = useUpdateAssistanceRecord();
  const createRecord = useCreateAssistanceRecord();
  const { data: individualTypes = [] } = useServiceTypes(true, "individual");

  const record = records.find((r) => r.id === id);

  const [interviewer, setInterviewer] = useState("");
  const [referral, setReferral] = useState("");
  const [observations, setObservations] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpReferral, setFollowUpReferral] = useState("");

  const { data: history = [] } = useAtendidoHistory(record?.atendido_id || null);

  // Get current referral level for follow-up filtering
  const currentServiceType = individualTypes.find((t) => t.name === (record?.referral || referral));
  const currentLevel = currentServiceType?.level || 1;
  const followUpTypes = individualTypes.filter((t) => t.level >= currentLevel && t.level <= currentLevel + 1);

  useEffect(() => {
    if (record) {
      setInterviewer(record.interviewer_name || "");
      setReferral(record.referral || "");
      setObservations(record.observations || "");
    }
  }, [record]);

  // Auto-set status to EM_ANDAMENTO when opening if AGUARDANDO
  useEffect(() => {
    if (record && record.status === "AGUARDANDO") {
      update.mutate({ id: record.id, status: "EM_ANDAMENTO" });
    }
  }, [record?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/atendimentos")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <p className="text-muted-foreground text-center py-12">Atendimento não encontrado.</p>
      </div>
    );
  }

  const previousRecords = history.filter((h) => h.id !== record.id);

  const handleSave = () => {
    update.mutate(
      {
        id: record.id,
        interviewer_name: interviewer || null,
        referral: referral || null,
        observations: observations || null,
      },
      {
        onSuccess: () => toast({ title: "Atendimento salvo!" }),
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      }
    );
  };

  const handleConclude = () => {
    update.mutate(
      {
        id: record.id,
        status: "CONCLUIDO",
        interviewer_name: interviewer || null,
        referral: referral || null,
        observations: observations || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Atendimento concluído!" });
          navigate("/atendimentos");
        },
        onError: () => toast({ title: "Erro ao concluir", variant: "destructive" }),
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
        visitor_name: record.visitor_name,
        phone: record.phone || null,
        email: record.email || null,
        address: record.address || null,
        symptom: record.symptom,
        referral: followUpReferral || referral || null,
        observations: `Encaminhamento do atendimento de ${new Date(record.created_at).toLocaleDateString("pt-BR")}. Responsável anterior: ${interviewer || "—"}`,
        status: "AGENDADO",
        atendido_id: record.atendido_id,
        linked_previous_id: record.id,
        interviewer_name: null,
      },
      {
        onSuccess: () => {
          toast({ title: "Novo atendimento agendado!" });
          setShowFollowUp(false);
        },
        onError: () => toast({ title: "Erro ao agendar", variant: "destructive" }),
      }
    );
  };

  const displayStatus = statusMap[record.status || "AGENDADO"] || "Agendado";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/atendimentos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Realizar Atendimento</h1>
          <p className="text-sm text-muted-foreground">Registro e acompanhamento do atendimento individual</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {displayStatus}
        </Badge>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Dados do Atendido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">{record.visitor_name}</span>
            </div>
            {record.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {record.phone}
              </div>
            )}
            {record.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {record.email}
              </div>
            )}
            {record.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {record.address}
              </div>
            )}
          </div>
          {record.symptom && (
            <>
              <Separator className="my-3" />
              <div className="text-sm">
                <span className="font-medium text-foreground flex items-center gap-1 mb-1">
                  <FileText className="h-3.5 w-3.5" /> Motivo / Queixa
                </span>
                <p className="text-muted-foreground">{record.symptom}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Attendance Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Entrevistador / Responsável</Label>
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
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o encaminhamento" />
                </SelectTrigger>
                <SelectContent>
                  {individualTypes.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name} (Nível {t.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações do atendimento..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {previousRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Histórico de Atendimentos ({previousRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {previousRecords.map((h) => {
                const hStatus = statusMap[h.status || "AGENDADO"] || "Agendado";
                return (
                  <div key={h.id} className="rounded-lg border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {new Date(h.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <Badge variant="outline">{hStatus}</Badge>
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
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-up */}
      {!showFollowUp && (
        <Button variant="outline" className="w-full" onClick={() => setShowFollowUp(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agendar Próximo Atendimento (encaminhamento)
        </Button>
      )}

      {showFollowUp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4" />
              Agendar Próximo Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              As informações do atendido e o histórico serão levados para o próximo atendimento.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
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
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-2 pb-8">
        <Button variant="outline" onClick={() => navigate("/atendimentos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave} disabled={update.isPending}>
            {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
          <Button onClick={handleConclude} disabled={update.isPending}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Concluir Atendimento
          </Button>
        </div>
      </div>
    </div>
  );
}
