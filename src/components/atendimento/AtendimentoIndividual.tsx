import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Clock, CheckCircle, Search, AlertCircle, Loader2, CalendarCheck, Phone, Play, X } from "lucide-react";
import { useAssistanceRecords, useCreateAssistanceRecord, type AssistanceRecord } from "@/hooks/useAssistanceRecords";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useToast } from "@/hooks/use-toast";
import AssistanceRecordDetail from "./AssistanceRecordDetail";

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

export default function AtendimentoIndividual() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserName = user?.user_metadata?.full_name || "";
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [tab, setTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AssistanceRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ visitor_name: "", phone: "", symptom: "", referral: "", observations: "" });

  const { data: records = [], isLoading } = useAssistanceRecords();
  const { data: individualTypes = [] } = useServiceTypes(true, "individual", 2);
  const sortedTypes = [...individualTypes].sort((a, b) => a.name.localeCompare(b.name));
  const defaultReferral = sortedTypes.length > 0 ? sortedTypes[0].name : "";
  const createRecord = useCreateAssistanceRecord();
  const { toast } = useToast();

  const allMapped = records.map((r) => ({
    ...r,
    displayStatus: statusMap[r.status || "AGENDADO"] || "Agendado",
  }));

  // Contadores: sempre do dia atual, sem restrição por usuário
  const today = new Date().toLocaleDateString("pt-BR");
  const todayRecords = allMapped.filter((s) => new Date(s.created_at).toLocaleDateString("pt-BR") === today);
  const agendados = todayRecords.filter((s) => s.displayStatus === "Agendado").length;
  const presentes = todayRecords.filter((s) => s.displayStatus === "Presente").length;
  const emAndamento = todayRecords.filter((s) => s.displayStatus === "Em andamento").length;
  const concluidos = todayRecords.filter((s) => s.displayStatus === "Concluído").length;

  // Lista: aplica restrição de visibilidade para concluídos + filtros de busca
  const filtered = allMapped.filter((s) => {
    // Concluídos só visíveis para o entrevistador
    if (s.status === "CONCLUIDO" && s.interviewer_name?.trim().toLowerCase() !== currentUserName.trim().toLowerCase()) return false;
    const matchSearch = s.visitor_name.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || s.displayStatus === tab;
    const matchDate = !dateFilter || new Date(s.created_at).toISOString().slice(0, 10) === dateFilter;
    return matchSearch && matchTab && matchDate;
  });

  const handleSubmit = () => {
    if (!form.visitor_name || !form.symptom) {
      toast({ title: "Preencha nome e motivo", variant: "destructive" });
      return;
    }
    createRecord.mutate(
      {
        visitor_name: form.visitor_name,
        phone: form.phone || null,
        symptom: form.symptom,
        referral: form.referral || null,
        observations: form.observations || null,
        status: "AGENDADO",
      },
      {
        onSuccess: () => {
          toast({ title: "Solicitação registrada!" });
          setForm({ visitor_name: "", phone: "", symptom: "", referral: "", observations: "" });
          setDialogOpen(false);
        },
        onError: () => toast({ title: "Erro ao registrar", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Solicitações Individuais</h2>
          <p className="text-sm text-muted-foreground">Acompanhamento individual de atendimentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (open) setForm((f) => ({ ...f, referral: f.referral || defaultReferral }));
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Solicitação</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Solicitação</DialogTitle>
              <DialogDescription>Registre uma nova solicitação de atendimento (por telefone)</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Solicitante *</Label>
                <Input placeholder="Nome completo" value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone
                </Label>
                <Input placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Encaminhamento</Label>
                <Select value={form.referral} onValueChange={(v) => setForm({ ...form, referral: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo de atendimento" /></SelectTrigger>
                  <SelectContent>
                    {sortedTypes.map((t) => (
                      <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Descrição / Motivo *</Label>
                <Textarea placeholder="Descreva brevemente o motivo da solicitação..." value={form.symptom} onChange={(e) => setForm({ ...form, symptom: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea placeholder="Observações adicionais..." value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={createRecord.isPending}>
                {createRecord.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CalendarCheck className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{agendados}</p>
              <p className="text-xs text-muted-foreground">Agendados hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{presentes}</p>
              <p className="text-xs text-muted-foreground">Presentes hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{emAndamento}</p>
              <p className="text-xs text-muted-foreground">Em andamento hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{concluidos}</p>
              <p className="text-xs text-muted-foreground">Concluídos hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por nome do atendido..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Input
                type="date"
                className="w-auto sm:w-44"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filtrar por data"
              />
              {(search || dateFilter || tab !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => { setSearch(""); setDateFilter(""); setTab("all"); }}
                >
                  <X className="h-4 w-4" />
                  Limpar filtros
                </Button>
              )}
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="Agendado">Agendados</TabsTrigger>
                <TabsTrigger value="Presente">Presentes</TabsTrigger>
                <TabsTrigger value="Em andamento">Em andamento</TabsTrigger>
                <TabsTrigger value="Concluído">Concluídos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data / Hora</TableHead>
                <TableHead className="hidden lg:table-cell">Entrevistador</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma solicitação encontrada</TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => {
                  const Icon = statusIcon[s.displayStatus] || CalendarCheck;
                  return (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(s); setDetailOpen(true); }}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{s.visitor_name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{s.symptom}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.phone ? (
                          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{s.phone}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell><Badge variant="outline">{s.referral || "—"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(s.created_at).toLocaleDateString("pt-BR")} {new Date(s.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{s.interviewer_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor[s.displayStatus]}>
                          <Icon className="mr-1 h-3 w-3" />{s.displayStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.status === "AGUARDANDO" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/atendimentos/${s.id}`);
                            }}
                          >
                            <Play className="h-3.5 w-3.5" />
                            Iniciar
                          </Button>
                        )}
                        {s.status === "EM_ANDAMENTO" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/atendimentos/${s.id}`);
                            }}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Retomar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AssistanceRecordDetail
        record={selectedRecord}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
