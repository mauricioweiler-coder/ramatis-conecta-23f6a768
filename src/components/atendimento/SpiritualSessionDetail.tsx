import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar, Clock, Users, Trash2, Plus, Lock, Mic, HardHat } from "lucide-react";
import type { SpiritualSession } from "@/hooks/useSpiritualSessions";
import { useUpdateSpiritualSession } from "@/hooks/useSpiritualSessions";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useWorkers } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";

interface ServiceEntry {
  service_type_id: string;
  people_count: number;
}

interface Props {
  session: SpiritualSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SpiritualSessionDetail({ session, open, onOpenChange }: Props) {
  const [sessionDate, setSessionDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [observations, setObservations] = useState("");
  const [services, setServices] = useState<ServiceEntry[]>([]);

  const update = useUpdateSpiritualSession();
  const { data: serviceTypes = [] } = useServiceTypes(true, "coletivo");
  const { data: workers = [] } = useWorkers();
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      setSessionDate(session.session_date);
      setStartTime(session.start_time || "");
      setResponsibleId(session.responsible_id || "");
      setSpeakerId(session.speaker_id || "");
      setObservations(session.observations || "");
      setServices(
        session.session_services.map((ss) => ({
          service_type_id: ss.service_type_id,
          people_count: ss.people_count,
        }))
      );
    }
  }, [session]);

  const editable = useMemo(() => {
    if (!session) return false;
    const sessionDateObj = new Date(session.session_date + "T23:59:59");
    const deadline = new Date(sessionDateObj);
    deadline.setDate(deadline.getDate() + 1);
    return new Date() <= deadline;
  }, [session]);

  if (!session) return null;

  const totalPeople = services.reduce((sum, s) => sum + s.people_count, 0);
  const responsibleName = session.responsible_worker?.full_name || session.responsible_name || "";
  const speakerName = session.speaker_worker?.full_name || session.speaker_name || "";

  const addService = () => setServices([...services, { service_type_id: "", people_count: 0 }]);
  const removeService = (idx: number) => setServices(services.filter((_, i) => i !== idx));
  const updateService = (idx: number, field: keyof ServiceEntry, value: string | number) => {
    const updated = [...services];
    updated[idx] = { ...updated[idx], [field]: value };
    setServices(updated);
  };

  const handleSave = () => {
    if (!sessionDate) {
      toast({ title: "Informe a data da sessão", variant: "destructive" });
      return;
    }
    const validServices = services.filter((s) => s.service_type_id && s.people_count > 0);
    update.mutate(
      {
        id: session.id,
        session_date: sessionDate,
        start_time: startTime || undefined,
        responsible_id: responsibleId || undefined,
        speaker_id: speakerId || undefined,
        observations: observations || undefined,
        services: validServices,
      },
      {
        onSuccess: () => {
          toast({ title: "Sessão atualizada!" });
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
            <Calendar className="h-5 w-5" />
            Detalhes da Sessão
            {!editable && (
              <Badge variant="secondary" className="ml-2 gap-1">
                <Lock className="h-3 w-3" />
                Somente leitura
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(session.session_date + "T12:00:00").toLocaleDateString("pt-BR")}
                {session.start_time && ` às ${session.start_time}`}
              </span>
              <div className="flex gap-2">
                <Badge variant="secondary" className="gap-1">
                  <HardHat className="h-3 w-3" />
                  {session.workers_present} trabalhador(es)
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {totalPeople} atendidos
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} disabled={!editable} />
              </div>
              <div className="grid gap-2">
                <Label>Horário</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={!editable} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Dirigente / Responsável</Label>
              {editable ? (
                <Select value={responsibleId} onValueChange={setResponsibleId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={responsibleName || "—"} disabled />
              )}
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                <Mic className="h-3.5 w-3.5" />
                Palestrante
              </Label>
              {editable ? (
                <Select value={speakerId} onValueChange={setSpeakerId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o palestrante" /></SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={speakerName || "—"} disabled />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Atendimentos Realizados</Label>
                {editable && (
                  <Button type="button" variant="outline" size="sm" onClick={addService}>
                    <Plus className="mr-1 h-3 w-3" />Adicionar
                  </Button>
                )}
              </div>
              {services.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Nenhum atendimento registrado</p>
              )}
              {services.map((s, idx) => {
                const typeName = serviceTypes.find((st) => st.id === s.service_type_id)?.name;
                return (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      {editable ? (
                        <Select value={s.service_type_id} onValueChange={(v) => updateService(idx, "service_type_id", v)}>
                          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                          <SelectContent>
                            {serviceTypes.map((st) => (
                              <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={typeName || "—"} disabled />
                      )}
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Qtd"
                        value={s.people_count || ""}
                        onChange={(e) => updateService(idx, "people_count", parseInt(e.target.value) || 0)}
                        disabled={!editable}
                      />
                    </div>
                    {editable && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeService(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                disabled={!editable}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {editable ? "Cancelar" : "Fechar"}
            </Button>
            {editable && (
              <Button onClick={handleSave} disabled={update.isPending}>
                {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
