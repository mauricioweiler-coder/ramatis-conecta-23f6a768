import { useState } from "react";
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
import { Plus, Clock, CheckCircle, Search, AlertCircle, Loader2 } from "lucide-react";
import { useAssistanceRecords, useCreateAssistanceRecord } from "@/hooks/useAssistanceRecords";
import { useToast } from "@/hooks/use-toast";

const statusMap: Record<string, string> = {
  AGUARDANDO: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

const statusColor: Record<string, string> = {
  Pendente: "bg-destructive/10 text-destructive border-destructive/20",
  "Em andamento": "bg-primary/10 text-primary border-primary/20",
  Concluído: "bg-muted text-muted-foreground border-border",
};

const statusIcon: Record<string, typeof Clock> = {
  Pendente: AlertCircle,
  "Em andamento": Clock,
  Concluído: CheckCircle,
};

export default function Atendimento() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ visitor_name: "", symptom: "", referral: "", observations: "" });

  const { data: records = [], isLoading } = useAssistanceRecords();
  const createRecord = useCreateAssistanceRecord();
  const { toast } = useToast();

  const mapped = records.map((r) => ({
    ...r,
    displayStatus: statusMap[r.status || "AGUARDANDO"] || "Pendente",
  }));

  const filtered = mapped.filter((s) => {
    const matchSearch = s.visitor_name.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || s.displayStatus === tab;
    return matchSearch && matchTab;
  });

  const pendentes = mapped.filter((s) => s.displayStatus === "Pendente").length;
  const emAndamento = mapped.filter((s) => s.displayStatus === "Em andamento").length;
  const concluidos = mapped.filter((s) => s.displayStatus === "Concluído").length;

  const handleSubmit = () => {
    if (!form.visitor_name || !form.symptom) {
      toast({ title: "Preencha nome e motivo", variant: "destructive" });
      return;
    }
    createRecord.mutate(
      {
        visitor_name: form.visitor_name,
        symptom: form.symptom,
        referral: form.referral || null,
        observations: form.observations || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Solicitação registrada!" });
          setForm({ visitor_name: "", symptom: "", referral: "", observations: "" });
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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Atendimento Espiritual</h1>
          <p className="text-muted-foreground">Solicitações e acompanhamento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Solicitação</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Solicitação</DialogTitle>
              <DialogDescription>Registre uma nova solicitação de atendimento espiritual</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Solicitante *</Label>
                <Input placeholder="Nome completo" value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Tipo de Atendimento</Label>
                <Select value={form.referral} onValueChange={(v) => setForm({ ...form, referral: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conversa Fraterna">Conversa Fraterna</SelectItem>
                    <SelectItem value="Passe">Passe</SelectItem>
                    <SelectItem value="Desobsessão">Desobsessão</SelectItem>
                    <SelectItem value="Orientação">Orientação Espiritual</SelectItem>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{emAndamento}</p>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{concluidos}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar solicitação..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="Pendente">Pendentes</TabsTrigger>
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
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden lg:table-cell">Entrevistador</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma solicitação encontrada</TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => {
                  const Icon = statusIcon[s.displayStatus];
                  return (
                    <TableRow key={s.id} className="cursor-pointer">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{s.visitor_name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{s.symptom}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{s.referral || "—"}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{s.interviewer_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor[s.displayStatus]}>
                          <Icon className="mr-1 h-3 w-3" />{s.displayStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
