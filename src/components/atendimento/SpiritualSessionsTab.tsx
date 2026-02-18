import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { SpiritualSession } from "@/hooks/useSpiritualSessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Calendar, Users, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpiritualSessions, useCreateSpiritualSession } from "@/hooks/useSpiritualSessions";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useToast } from "@/hooks/use-toast";
import SpiritualSessionDetail from "./SpiritualSessionDetail";

interface ServiceEntry {
  service_type_id: string;
  people_count: number;
}

export default function SpiritualSessionsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [responsible, setResponsible] = useState("");
  const [observations, setObservations] = useState("");
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [selectedSession, setSelectedSession] = useState<SpiritualSession | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: sessions = [], isLoading } = useSpiritualSessions();
  const { data: serviceTypes = [] } = useServiceTypes(true, undefined, 1);
  const create = useCreateSpiritualSession();
  const { toast } = useToast();

  const addService = () => {
    setServices([...services, { service_type_id: "", people_count: 0 }]);
  };

  const removeService = (idx: number) => {
    setServices(services.filter((_, i) => i !== idx));
  };

  const updateService = (idx: number, field: keyof ServiceEntry, value: string | number) => {
    const updated = [...services];
    updated[idx] = { ...updated[idx], [field]: value };
    setServices(updated);
  };

  const resetForm = () => {
    setSessionDate("");
    setStartTime("19:00");
    setResponsible("");
    setObservations("");
    setServices([]);
  };

  const handleSubmit = () => {
    if (!sessionDate) {
      toast({ title: "Informe a data da sessão", variant: "destructive" });
      return;
    }
    const validServices = services.filter((s) => s.service_type_id && s.people_count > 0);
    create.mutate(
      {
        session_date: sessionDate,
        start_time: startTime || undefined,
        responsible_name: responsible || undefined,
        observations: observations || undefined,
        services: validServices,
      },
      {
        onSuccess: () => {
          toast({ title: "Sessão registrada!" });
          resetForm();
          setDialogOpen(false);
        },
        onError: () => toast({ title: "Erro ao registrar", variant: "destructive" }),
      }
    );
  };

  const totalPeople = (session: typeof sessions[0]) =>
    session.session_services.reduce((sum, s) => sum + s.people_count, 0);

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
          <h2 className="text-xl font-semibold text-foreground">Sessões Espirituais</h2>
          <p className="text-sm text-muted-foreground">Registro de palestras e atendimentos coletivos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Sessão</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Sessão</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data *</Label>
                  <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Horário</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Dirigente / Responsável</Label>
                <Input placeholder="Nome do responsável" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Atendimentos Realizados</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addService}>
                    <Plus className="mr-1 h-3 w-3" />Adicionar
                  </Button>
                </div>
                {services.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Clique em "Adicionar" para registrar atendimentos
                  </p>
                )}
                {services.map((s, idx) => (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select value={s.service_type_id} onValueChange={(v) => updateService(idx, "service_type_id", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map((st) => (
                            <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Qtd"
                        value={s.people_count || ""}
                        onChange={(e) => updateService(idx, "people_count", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeService(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea placeholder="Observações..." value={observations} onChange={(e) => setObservations(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead className="hidden md:table-cell">Dirigente</TableHead>
                <TableHead>Atendimentos</TableHead>
                <TableHead className="text-right">Total Pessoas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma sessão registrada
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedSession(s); setDetailOpen(true); }}>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(s.session_date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.start_time || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{s.responsible_name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.session_services.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          s.session_services.map((ss) => (
                            <Badge key={ss.id} variant="outline" className="text-xs">
                              {ss.service_type?.name || "?"}: {ss.people_count}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{totalPeople(s)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SpiritualSessionDetail
        session={selectedSession}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
