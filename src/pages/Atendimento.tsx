import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Heart, Clock, CheckCircle, Search, AlertCircle } from "lucide-react";

interface Solicitacao {
  id: string;
  nome: string;
  tipo: string;
  status: "Pendente" | "Em andamento" | "Concluído";
  dataSolicitacao: string;
  responsavel: string;
  resumo: string;
}

const mockSolicitacoes: Solicitacao[] = [
  { id: "1", nome: "José Pereira", tipo: "Conversa Fraterna", status: "Pendente", dataSolicitacao: "2026-02-17", responsavel: "—", resumo: "Busca apoio emocional após perda familiar" },
  { id: "2", nome: "Cláudia Mendes", tipo: "Passe", status: "Em andamento", dataSolicitacao: "2026-02-15", responsavel: "Teresa Costa", resumo: "Dores de cabeça frequentes e insônia" },
  { id: "3", nome: "Ricardo Alves", tipo: "Desobsessão", status: "Em andamento", dataSolicitacao: "2026-02-14", responsavel: "Paulo Mendes", resumo: "Relata perturbações espirituais em casa" },
  { id: "4", nome: "Marina Costa", tipo: "Conversa Fraterna", status: "Concluído", dataSolicitacao: "2026-02-10", responsavel: "Clara Souza", resumo: "Orientação sobre estudo espírita" },
  { id: "5", nome: "André Lima", tipo: "Passe", status: "Pendente", dataSolicitacao: "2026-02-16", responsavel: "—", resumo: "Ansiedade e dificuldades no trabalho" },
];

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

  const filtered = mockSolicitacoes.filter((s) => {
    const matchSearch = s.nome.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || s.status === tab;
    return matchSearch && matchTab;
  });

  const pendentes = mockSolicitacoes.filter((s) => s.status === "Pendente").length;
  const emAndamento = mockSolicitacoes.filter((s) => s.status === "Em andamento").length;
  const concluidos = mockSolicitacoes.filter((s) => s.status === "Concluído").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Atendimento Espiritual</h1>
          <p className="text-muted-foreground">Solicitações e acompanhamento</p>
        </div>
        <Dialog>
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
                <Label>Nome do Solicitante</Label>
                <Input placeholder="Nome completo" />
              </div>
              <div className="grid gap-2">
                <Label>Tipo de Atendimento</Label>
                <Select>
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
                <Label>Descrição / Motivo</Label>
                <Textarea placeholder="Descreva brevemente o motivo da solicitação..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Registrar</Button>
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
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const Icon = statusIcon[s.status];
                return (
                  <TableRow key={s.id} className="cursor-pointer">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{s.nome}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.resumo}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{s.tipo}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(s.dataSolicitacao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{s.responsavel}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[s.status]}>
                        <Icon className="mr-1 h-3 w-3" />{s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma solicitação encontrada</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
