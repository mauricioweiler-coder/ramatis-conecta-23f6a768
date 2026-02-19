import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, GraduationCap, Users, Calendar, BookOpen, Loader2, UserPlus, Pencil, ClipboardList } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useCourses, useCourseStudentCounts, useWorkers, useProfessorWorkers, useCreateCourse } from "@/hooks/useCourses";
import { toast } from "sonner";
import type { CourseInsert, Course } from "@/hooks/useCourses";
import { CourseStudentsDialog } from "@/components/CourseStudentsDialog";
import { EditCourseDialog } from "@/components/EditCourseDialog";
import { CourseAttendanceDialog } from "@/components/CourseAttendanceDialog";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useEnrollStudent } from "@/hooks/useCourseStudents";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const COURSE_STATUSES = ["Planejado", "Inscrições Abertas", "Em Andamento", "Concluído"] as const;

const statusVariant: Record<string, string> = {
  "Planejado": "bg-secondary/10 text-secondary border-secondary/20",
  "Inscrições Abertas": "bg-primary/10 text-primary border-primary/20",
  "Em Andamento": "bg-primary/10 text-primary border-primary/20",
  "Concluído": "bg-muted text-muted-foreground border-border",
};


const graduationLabels: Record<string, string> = {
  professor: "Professor",
  estagiario: "Estagiário",
  trabalhador: "Trabalhador",
};

const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function Cursos() {
  const { role, isAdminOrDiretor } = useCurrentUserRole();
  const { user } = useAuth();
  const isAluno = role === "aluno";

  const { data: courses, isLoading } = useCourses(isAluno ? 1 : undefined);
  const { data: studentCounts } = useCourseStudentCounts();
  const { data: workers } = useWorkers();
  const { data: professorWorkers } = useProfessorWorkers();
  const createCourse = useCreateCourse();
  const enrollStudent = useEnrollStudent();

  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [attendanceCourse, setAttendanceCourse] = useState<Course | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [form, setForm] = useState<Partial<CourseInsert> & { assistant_ids?: string[] }>({ level: 1, assistant_ids: [] });

  // Aluno: get member record
  const { data: myMember } = useQuery({
    queryKey: ["my-member", user?.email],
    enabled: isAluno && !!user?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id")
        .eq("email", user!.email!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ["my-enrollments", myMember?.id],
    enabled: isAluno && !!myMember?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_students")
        .select("course_id")
        .eq("member_id", myMember!.id);
      if (error) throw error;
      return new Set(data.map((d) => d.course_id));
    },
  });

  const handleEnroll = async (courseId: string) => {
    if (!myMember?.id) {
      toast.error("Seu cadastro de membro não foi encontrado.");
      return;
    }
    setEnrollingCourseId(courseId);
    try {
      await enrollStudent.mutateAsync({ courseId, memberId: myMember.id });
      toast.success("Matrícula realizada com sucesso!");
    } catch (e: any) {
      toast.error(e.message?.includes("duplicate") ? "Você já está matriculado neste curso." : (e.message || "Erro ao realizar matrícula"));
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleCreate = async () => {
    if (!form.name) { toast.error("Informe o nome do curso"); return; }
    try {
      await createCourse.mutateAsync({
        name: form.name,
        description: form.description,
        coordinator_id: form.coordinator_id,
        main_teacher_id: form.main_teacher_id,
        assistant_ids: form.assistant_ids && form.assistant_ids.length > 0 ? form.assistant_ids : null,
        weekday: form.weekday,
        start_date: form.start_date,
        end_date: form.end_date,
        start_time: form.start_time,
        room: form.room,
        graduation_role: form.graduation_role,
        status: form.status || "Planejado",
        level: form.level || 1,
      });
      toast.success("Curso criado com sucesso!");
      setForm({ level: 1, assistant_ids: [] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar curso");
    }
  };

  const coursesWithStatus = (courses || []).map((c) => ({
    ...c,
    displayStatus: c.status || "Planejado",
    alunos: studentCounts?.[c.id] || 0,
  }));

  // Level filter
  const filteredCourses = levelFilter === "all"
    ? coursesWithStatus
    : coursesWithStatus.filter((c) => c.level === Number(levelFilter));

  const totalAlunos = studentCounts ? Object.values(studentCounts).reduce((s, c) => s + c, 0) : 0;
  const totalAtivos = coursesWithStatus.filter((c) => c.displayStatus === "Em Andamento" || c.displayStatus === "Inscrições Abertas").length;

  // Available levels from data
  const availableLevels = [...new Set(coursesWithStatus.map((c) => c.level))].sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Cursos</h1>
          <p className="text-muted-foreground">
            {isAluno ? "Selecione um curso para se matricular" : "Gestão de cursos e turmas"}
          </p>
        </div>
        {!isAluno && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Novo Curso</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Curso</DialogTitle>
                <DialogDescription>Preencha as informações do novo curso</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid gap-2">
                  <Label>Nome do Curso</Label>
                  <Input placeholder="Nome do curso" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea placeholder="Descreva o curso..." value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nível</Label>
                    <Select value={String(form.level || 1)} onValueChange={(v) => setForm({ ...form, level: Number(v) })}>
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
                    <Input placeholder="Ex: Sala 1" value={form.room || ""} onChange={(e) => setForm({ ...form, room: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Coordenador</Label>
                    <Select value={form.coordinator_id || ""} onValueChange={(v) => setForm({ ...form, coordinator_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {(professorWorkers || []).map((w) => (<SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Professor</Label>
                    <Select value={form.main_teacher_id || ""} onValueChange={(v) => setForm({ ...form, main_teacher_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {(professorWorkers || []).map((w) => (<SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Auxiliares</Label>
                  <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                    {(workers || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum trabalhador disponível</p>
                    )}
                    {(workers || []).map((w) => (
                      <div key={w.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`create-assistant-${w.id}`}
                          checked={(form.assistant_ids || []).includes(w.id)}
                          onCheckedChange={() => setForm((prev) => ({
                            ...prev,
                            assistant_ids: (prev.assistant_ids || []).includes(w.id)
                              ? (prev.assistant_ids || []).filter((id) => id !== w.id)
                              : [...(prev.assistant_ids || []), w.id],
                          }))}
                        />
                        <label htmlFor={`create-assistant-${w.id}`} className="text-sm cursor-pointer">{w.full_name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Dia da Semana</Label>
                    <Select value={form.weekday || ""} onValueChange={(v) => setForm({ ...form, weekday: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Horário</Label>
                    <Input type="time" value={form.start_time || ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Data Início</Label>
                    <Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Data Fim</Label>
                    <Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Graduação ao Concluir</Label>
                  <Select value={form.graduation_role || ""} onValueChange={(v) => setForm({ ...form, graduation_role: v })}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="estagiario">Estagiário</SelectItem>
                      <SelectItem value="trabalhador">Trabalhador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status || "Planejado"} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COURSE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={createCourse.isPending}>
                  {createCourse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Curso
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats cards */}
      {!isAluno && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{coursesWithStatus.length}</p>
                <p className="text-xs text-muted-foreground">Total de Cursos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAlunos}</p>
                <p className="text-xs text-muted-foreground">Total de Alunos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAtivos}</p>
                <p className="text-xs text-muted-foreground">Cursos Ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Level filter tabs */}
      {!isAluno && availableLevels.length > 1 && (
        <Tabs value={levelFilter} onValueChange={setLevelFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {availableLevels.map((l) => (
              <TabsTrigger key={l} value={String(l)}>Nível {l}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Course grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              {isAluno ? "Nenhum curso disponível no momento" : "Nenhum curso cadastrado"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAluno ? "Aguarde a abertura de novos cursos" : 'Clique em "Novo Curso" para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((curso) => {
            const isEnrolled = myEnrollments?.has(curso.id);
            const isEnrolling = enrollingCourseId === curso.id;
            return (
              <Card key={curso.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{curso.name}</CardTitle>
                      {!isAluno && (
                        <Badge variant="secondary" className="text-xs">N{curso.level}</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className={statusVariant[curso.displayStatus] || ""}>{curso.displayStatus}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{curso.description || "Sem descrição"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{curso.alunos} alunos</span>
                  </div>
                  {curso.weekday && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{curso.weekday}{curso.start_time ? ` às ${curso.start_time}` : ""}</span>
                    </div>
                  )}
                  {!isAluno && curso.graduation_role && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>Gradua para: {graduationLabels[curso.graduation_role] || curso.graduation_role}</span>
                    </div>
                  )}

                  {/* Aluno: enroll button */}
                  {isAluno && curso.displayStatus === "Inscrições Abertas" && (
                    <Button
                      className="w-full"
                      variant={isEnrolled ? "outline" : "default"}
                      disabled={isEnrolled || isEnrolling}
                      onClick={() => handleEnroll(curso.id)}
                    >
                      {isEnrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      {isEnrolled ? "Já matriculado" : "Matricular-se"}
                    </Button>
                  )}

                  {/* Admin: action buttons */}
                  {!isAluno && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedCourse(curso)}>
                        <Users className="mr-1 h-3 w-3" />Alunos
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setAttendanceCourse(curso)}>
                        <ClipboardList className="mr-1 h-3 w-3" />Presença
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditCourse(curso)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      {selectedCourse && !isAluno && (
        <CourseStudentsDialog
          course={selectedCourse}
          open={!!selectedCourse}
          onOpenChange={(o) => !o && setSelectedCourse(null)}
        />
      )}
      {editCourse && !isAluno && (
        <EditCourseDialog
          course={editCourse}
          open={!!editCourse}
          onOpenChange={(o) => !o && setEditCourse(null)}
        />
      )}
      {attendanceCourse && !isAluno && (
        <CourseAttendanceDialog
          course={attendanceCourse}
          open={!!attendanceCourse}
          onOpenChange={(o) => !o && setAttendanceCourse(null)}
        />
      )}
    </div>
  );
}
