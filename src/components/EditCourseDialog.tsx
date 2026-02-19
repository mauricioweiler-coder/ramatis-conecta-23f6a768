import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useUpdateCourse, useDeleteCourse, useWorkers } from "@/hooks/useCourses";
import { toast } from "sonner";
import type { Course } from "@/hooks/useCourses";

interface Props {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export function EditCourseDialog({ course, open, onOpenChange }: Props) {
  const { data: workers } = useWorkers();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [form, setForm] = useState({
    name: course.name,
    description: course.description || "",
    coordinator_id: course.coordinator_id || "",
    main_teacher_id: course.main_teacher_id || "",
    weekday: course.weekday || "",
    start_time: course.start_time || "",
    start_date: course.start_date || "",
    end_date: course.end_date || "",
    room: course.room || "",
    graduation_role: course.graduation_role || "",
    level: course.level,
  });

  useEffect(() => {
    setForm({
      name: course.name,
      description: course.description || "",
      coordinator_id: course.coordinator_id || "",
      main_teacher_id: course.main_teacher_id || "",
      weekday: course.weekday || "",
      start_time: course.start_time || "",
      start_date: course.start_date || "",
      end_date: course.end_date || "",
      room: course.room || "",
      graduation_role: course.graduation_role || "",
      level: course.level,
    });
  }, [course]);

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Informe o nome do curso");
      return;
    }
    try {
      await updateCourse.mutateAsync({
        id: course.id,
        name: form.name,
        description: form.description || null,
        coordinator_id: form.coordinator_id || null,
        main_teacher_id: form.main_teacher_id || null,
        weekday: form.weekday || null,
        start_time: form.start_time || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        room: form.room || null,
        graduation_role: form.graduation_role || null,
        level: form.level,
      });
      toast.success("Curso atualizado!");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar curso");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse.mutateAsync(course.id);
      toast.success("Curso excluído!");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir curso");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
          <DialogDescription>Atualize as informações do curso</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid gap-2">
            <Label>Nome do Curso</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Nível</Label>
              <Select value={String(form.level)} onValueChange={(v) => setForm({ ...form, level: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>Nível {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Sala</Label>
              <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Coordenador</Label>
              <Select value={form.coordinator_id} onValueChange={(v) => setForm({ ...form, coordinator_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(workers || []).map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Professor</Label>
              <Select value={form.main_teacher_id} onValueChange={(v) => setForm({ ...form, main_teacher_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(workers || []).map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Dia da Semana</Label>
              <Select value={form.weekday} onValueChange={(v) => setForm({ ...form, weekday: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Horário</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Data Início</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Data Fim</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Graduação ao Concluir</Label>
            <Select value={form.graduation_role} onValueChange={(v) => setForm({ ...form, graduation_role: v })}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="estagiario">Estagiário</SelectItem>
                <SelectItem value="trabalhador">Trabalhador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. Todos os dados de alunos e presença serão perdidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={updateCourse.isPending}>
            {updateCourse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
