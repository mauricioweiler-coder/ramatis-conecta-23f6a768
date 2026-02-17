import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Loader2, Plus, UserCheck } from "lucide-react";
import { useCourseStudents, useEnrollStudent, useUpdateStudentStatus, useMembers } from "@/hooks/useCourseStudents";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  course: Tables<"courses"> & { status?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<string, string> = {
  ATIVO: "Ativo",
  CONCLUIDO: "Concluído",
  DESISTENTE: "Desistente",
};

const statusColor: Record<string, string> = {
  ATIVO: "bg-primary/10 text-primary border-primary/20",
  CONCLUIDO: "bg-muted text-muted-foreground border-border",
  DESISTENTE: "bg-destructive/10 text-destructive border-destructive/20",
};

const graduationLabels: Record<string, string> = {
  professor: "Professor",
  estagiario: "Estagiário",
  trabalhador: "Trabalhador",
};

export function CourseStudentsDialog({ course, open, onOpenChange }: Props) {
  const { data: students = [], isLoading } = useCourseStudents(open ? course.id : null);
  const { data: allMembers = [] } = useMembers();
  const enrollStudent = useEnrollStudent();
  const updateStatus = useUpdateStudentStatus();
  const { toast } = useToast();
  const [selectedMember, setSelectedMember] = useState("");

  const enrolledIds = new Set(students.map((s: any) => s.member_id));
  const availableMembers = allMembers.filter((m) => !enrolledIds.has(m.id));

  const handleEnroll = () => {
    if (!selectedMember) return;
    enrollStudent.mutate(
      { courseId: course.id, memberId: selectedMember },
      {
        onSuccess: () => {
          toast({ title: "Aluno matriculado!" });
          setSelectedMember("");
        },
        onError: (err) => toast({ title: "Erro", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const handleStatusChange = (studentId: string, newStatus: string) => {
    updateStatus.mutate(
      { id: studentId, status: newStatus, courseId: course.id },
      {
        onSuccess: () => {
          const msg = newStatus === "CONCLUIDO" && course.graduation_role
            ? `Aluno concluído! Role será elevado para ${graduationLabels[course.graduation_role] || course.graduation_role}.`
            : "Status atualizado!";
          toast({ title: msg });
        },
        onError: (err) => toast({ title: "Erro", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {course.name} — Alunos
          </DialogTitle>
          <DialogDescription>
            Gerencie os alunos matriculados neste curso.
            {course.graduation_role && (
              <span className="block mt-1 font-medium">
                🎓 Ao concluir, alunos serão graduados para: {graduationLabels[course.graduation_role] || course.graduation_role}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Enroll new student */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar membro para matricular..." />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}{m.email ? ` (${m.email})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleEnroll} disabled={!selectedMember || enrollStudent.isPending} size="sm">
            {enrollStudent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Matricular
          </Button>
        </div>

        {/* Students list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum aluno matriculado</TableCell>
                </TableRow>
              ) : (
                students.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{s.members?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{s.members?.email || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[s.status] || ""}>
                        {statusLabels[s.status] || s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === "ATIVO" ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(s.id, "CONCLUIDO")}
                            disabled={updateStatus.isPending}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Concluir
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleStatusChange(s.id, "DESISTENTE")}
                            disabled={updateStatus.isPending}
                          >
                            Desistente
                          </Button>
                        </div>
                      ) : s.status === "CONCLUIDO" && course.graduation_role ? (
                        <span className="text-xs text-muted-foreground">
                          🎓 Graduado: {graduationLabels[course.graduation_role] || course.graduation_role}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
