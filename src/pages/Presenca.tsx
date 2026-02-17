import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanFace, UserCheck, Clock, Calendar, Search, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAttendanceToday, useCreateAttendance } from "@/hooks/useAttendance";
import { useToast } from "@/hooks/use-toast";

export default function Presenca() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ member_name: "", activity_type: "" });
  const hoje = new Date().toLocaleDateString("pt-BR");

  const { data: records = [], isLoading } = useAttendanceToday();
  const createAttendance = useCreateAttendance();
  const { toast } = useToast();

  const filtered = records.filter((p) =>
    (p.member_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!form.member_name || !form.activity_type) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    createAttendance.mutate(
      { member_name: form.member_name, activity_type: form.activity_type },
      {
        onSuccess: () => {
          toast({ title: "Presença registrada!" });
          setForm({ member_name: "", activity_type: "" });
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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Registro de Presença</h1>
          <p className="text-muted-foreground">Controle de presença dos colaboradores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Registrar Presença</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Presença Manual</DialogTitle>
              <DialogDescription>Registre a presença de um colaborador manualmente</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input placeholder="Nome do colaborador" value={form.member_name} onChange={(e) => setForm({ ...form, member_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Atividade *</Label>
                <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sessão">Sessão</SelectItem>
                    <SelectItem value="Estudo">Estudo</SelectItem>
                    <SelectItem value="Curso">Curso</SelectItem>
                    <SelectItem value="Voluntariado">Voluntariado</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={createAttendance.isPending}>
                {createAttendance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <UserCheck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{records.length}</p>
              <p className="text-xs text-muted-foreground">Presenças Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <ScanFace className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{records.filter((p) => p.activity_type === "Sessão").length}</p>
              <p className="text-xs text-muted-foreground">Sessões</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{hoje}</p>
              <p className="text-xs text-muted-foreground">Data Atual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanFace className="h-5 w-5 text-primary" />
            Módulo de Reconhecimento Facial
          </CardTitle>
          <CardDescription>
            O módulo de reconhecimento facial opera em um tablet dedicado. Abaixo está o registro de presenças do dia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <ScanFace className="mr-2 h-4 w-4" />
            Modo tablet — Disponível apenas no dispositivo dedicado
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presenças de Hoje</CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar colaborador..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhuma presença registrada hoje</TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-foreground">{p.member_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(p.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.activity_type}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
