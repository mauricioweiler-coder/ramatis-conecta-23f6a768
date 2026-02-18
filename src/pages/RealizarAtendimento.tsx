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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, ArrowLeft, User, Phone, MapPin, Mail, FileText,
  ArrowRight, Clock, CheckCircle, History, Play, CalendarCheck,
} from "lucide-react";
import { useAssistanceRecords, useUpdateAssistanceRecord, useCreateAssistanceRecord } from "@/hooks/useAssistanceRecords";
import { useAtendidoHistory } from "@/hooks/useAtendidos";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useWorkersList } from "@/hooks/useWorkers";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
  
  const { data: records = [], isLoading } = useAssistanceRecords();
  const update = useUpdateAssistanceRecord();
  const createRecord = useCreateAssistanceRecord();
  const { data: individualTypes = [] } = useServiceTypes(true, "individual");
  const { data: workers = [] } = useWorkersList();

  const record = records.find((r) => r.id === id);
  
  // Bloquear acesso a atendimentos concluídos de outro entrevistador (por ID)
  const accessDenied = record?.status === "CONCLUIDO" && record?.interviewer_id !== user?.id;

  const [interviewerId, setInterviewerId] = useState("");
  const [observations, setObservations] = useState("");
  const [started, setStarted] = useState(false);

  // Finalização
  const [concluido, setConcluido] = useState(true); // true = concluído sem encaminhamento
  const [followUpReferral, setFollowUpReferral] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const { data: history = [] } = useAtendidoHistory(record?.atendido_id || null);

  // Get current referral level for follow-up filtering
  const currentServiceType = individualTypes.find((t) => t.name === record?.referral);
  const currentLevel = currentServiceType?.level || 1;
  const followUpTypes = individualTypes.filter((t) => t.level >= currentLevel && t.level <= currentLevel + 1);

  useEffect(() => {
    if (record) {
      // Pre-select current user or existing interviewer
      setInterviewerId(record.interviewer_id || user?.id || "");
      setObservations(record.observations || "");
      if (record.status === "EM_ANDAMENTO") {
        setStarted(true);
      }
    }
  }, [record, user?.id]);

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

  if (accessDenied) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/atendimentos")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <p className="text-muted-foreground text-center py-12">Você não tem permissão para visualizar este atendimento concluído.</p>
      </div>
    );
  }

  const previousRecords = history.filter((h) => h.id !== record.id);
  const displayStatus = statusMap[record.status || "AGENDADO"] || "Agendado";
  const isEditable = record.status !== "CONCLUIDO";
  const selectedWorker = workers.find((w) => w.id === interviewerId);
  const interviewerName = selectedWorker?.full_name || "";

  const handleStart = () => {
    update.mutate(
      { id: record.id, status: "EM_ANDAMENTO" },
      {
        onSuccess: () => {
          setStarted(true);
          toast({ title: "Atendimento iniciado!" });
        },
        onError: () => toast({ title: "Erro ao iniciar", variant: "destructive" }),
      }
    );
  };

  const handleFinalize = () => {
    if (!concluido && !followUpDate) {
      toast({ title: "Informe a data do próximo atendimento", variant: "destructive" });
      return;
    }
    if (!concluido && !followUpReferral) {
      toast({ title: "Selecione o encaminhamento do próximo atendimento", variant: "destructive" });
      return;
    }

    // Conclude current record
    update.mutate(
      {
        id: record.id,
        status: "CONCLUIDO",
        interviewer_name: interviewerName || null,
        interviewer_id: interviewerId || null,
        observations: observations || null,
        referral: concluido ? (record.referral || null) : followUpReferral,
      },
      {
        onSuccess: () => {
          if (concluido) {
            toast({ title: "Atendimento concluído!" });
            navigate("/atendimentos");
            return;
          }
          // Create follow-up record
          createRecord.mutate(
            {
              visitor_name: record.visitor_name,
              phone: record.phone || null,
              email: record.email || null,
              address: record.address || null,
              symptom: record.symptom,
              referral: followUpReferral,
              observations: `Encaminhamento do atendimento de ${new Date(record.created_at).toLocaleDateString("pt-BR")}. Responsável anterior: ${interviewerName || "—"}`,
              status: "AGENDADO",
              atendido_id: record.atendido_id,
              linked_previous_id: record.id,
              interviewer_name: null,
            },
            {
              onSuccess: () => {
                toast({ title: "Atendimento concluído e próximo agendado!" });
                navigate("/atendimentos");
              },
              onError: () => toast({ title: "Erro ao agendar próximo atendimento", variant: "destructive" }),
            }
          );
        },
        onError: () => toast({ title: "Erro ao concluir", variant: "destructive" }),
      }
    );
  };

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
          {record.referral && (
            <>
              <Separator className="my-3" />
              <div className="text-sm">
                <span className="font-medium text-foreground flex items-center gap-1 mb-1">
                  <ArrowRight className="h-3.5 w-3.5" /> Encaminhamento atual
                </span>
                <Badge variant="outline">{record.referral}</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Botão Iniciar - aparece antes de iniciar */}
      {isEditable && !started && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Play className="h-12 w-12 text-primary" />
            <p className="text-muted-foreground text-center">
              Clique para iniciar o atendimento. O status será alterado para "Em andamento".
            </p>
            <Button size="lg" onClick={handleStart} disabled={update.isPending}>
              {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Play className="mr-2 h-4 w-4" />
              Iniciar Atendimento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Attendance Form - aparece após iniciar */}
      {started && isEditable && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Entrevistador / Responsável *</Label>
                <Select value={interviewerId} onValueChange={setInterviewerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o trabalhador" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.full_name}
                      </SelectItem>
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
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Finalização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-4 w-4" />
                Finalizar Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="concluido"
                  checked={concluido}
                  onCheckedChange={(v) => setConcluido(!!v)}
                />
                <Label htmlFor="concluido" className="cursor-pointer">
                  Atendimento concluído (sem necessidade de encaminhamento)
                </Label>
              </div>

              {!concluido && (
                <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    O atendido será encaminhado para um novo atendimento. Preencha os dados abaixo:
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1">
                        <ArrowRight className="h-3.5 w-3.5" />
                        Encaminhamento (mesmo nível ou +1) *
                      </Label>
                      <Select value={followUpReferral} onValueChange={setFollowUpReferral}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {followUpTypes.map((t) => (
                            <SelectItem key={t.id} value={t.name}>
                              {t.name} (Nível {t.level})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1">
                        <CalendarCheck className="h-3.5 w-3.5" />
                        Data do próximo atendimento *
                      </Label>
                      <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => navigate("/atendimentos")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleFinalize} disabled={update.isPending || createRecord.isPending}>
                  {(update.isPending || createRecord.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {concluido ? "Concluir Atendimento" : "Concluir e Agendar Próximo"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* View-only for concluded */}
      {record.status === "CONCLUIDO" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {record.interviewer_name && (
              <div className="text-sm">
                <span className="font-medium text-foreground">Entrevistador:</span>{" "}
                <span className="text-muted-foreground">{record.interviewer_name}</span>
              </div>
            )}
            {record.observations && (
              <div className="text-sm">
                <span className="font-medium text-foreground">Observações:</span>{" "}
                <span className="text-muted-foreground">{record.observations}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Voltar button at bottom for concluded */}
      {record.status === "CONCLUIDO" && (
        <div className="pb-8">
          <Button variant="outline" onClick={() => navigate("/atendimentos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
}
