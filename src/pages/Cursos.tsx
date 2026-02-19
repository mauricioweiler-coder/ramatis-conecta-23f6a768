import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GraduationCap, Users, Calendar, BookOpen, Loader2, UserPlus } from "lucide-react";
import { useCourses, useCourseStudentCounts, useWorkers, useCreateCourse } from "@/hooks/useCourses";
import { toast } from "sonner";
import type { CourseInsert, Course } from "@/hooks/useCourses";
import { CourseStudentsDialog } from "@/components/CourseStudentsDialog";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useEnrollStudent, useCourseStudents } from "@/hooks/useCourseStudents";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const statusVariant: Record<string, string> = {
  Ativo: "bg-primary/10 text-primary border-primary/20",
  Encerrado: "bg-muted text-muted-foreground border-border",
  Planejado: "bg-secondary/10 text-secondary border-secondary/20",
};

function getCourseStatus(course: { start_date: string | null; end_date: string | null }): string {
  const today = new Date().toISOString().slice(0, 10);
  if (!course.start_date || course.start_date > today) return "Planejado";
  if (course.end_date && course.end_date < today) return "Encerrado";
  return "Ativo";
}

const graduationLabels: Record<string, string> = {
  professor: "Professor",
  estagiario: "Estagiário",
  trabalhador: "Trabalhador",
};

export default function Cursos() {
  const { role, isAdminOrDiretor } = useCurrentUserRole();
  const { user } = useAuth();
  const isAluno = role === "aluno";

  const { data: courses, isLoading } = useCourses(isAluno ? 1 : undefined);
  const { data: studentCounts } = useCourseStudentCounts();
  const { data: workers } = useWorkers();
  const createCourse = useCreateCourse();
  const enrollStudent = useEnrollStudent();
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<(Course & { status?: string; alunos?: number }) | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CourseInsert>>({});

  // Get the member record for the current user (by email match)
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

  // Get courses the student is already enrolled in
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
      toast.error("Seu cadastro de membro não foi encontrado. Verifique se seu e-mail está correto.");
      return;
    }
    setEnrollingCourseId(courseId);
    try {
      await enrollStudent.mutateAsync({ courseId, memberId: myMember.id });
      toast.success("Matrícula realizada com sucesso!");
    } catch (e: any) {
      if (e.message?.includes("duplicate")) {
        toast.error("Você já está matriculado neste curso.");
      } else {
        toast.error(e.message || "Erro ao realizar matrícula");
      }
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleCreate = async () => {
    if (!form.name) {
      toast.error("Informe o nome do curso");
      return;
    }
    try {
      await createCourse.mutateAsync({
        name: form.name,
        description: form.description,
        coordinator_id: form.coordinator_id,
        main_teacher_id: form.main_teacher_id,
        weekday: form.weekday,
        start_date: form.start_date,
        end_date: form.end_date,
        start_time: form.start_time,
        room: form.room,
        graduation_role: form.graduation_role,
      });
      toast.success("Curso criado com sucesso!");
      setForm({});
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar curso");
    }
  };

  const totalAlunos = studentCounts
    ? Object.values(studentCounts).reduce((s, c) => s + c, 0)
    : 0;

  const coursesWithStatus = (courses || []).map((c) => ({
    ...c,
    status: getCourseStatus(c),
    alunos: studentCounts?.[c.id] || 0,
  }));

  const totalAtivos = coursesWithStatus.filter((c) => c.status === "Ativo").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Curso</Label>
                <Input
                  placeholder="Nome do curso"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o curso..."
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Coordenador</Label>
                  <Select
                    value={form.coordinator_id || ""}
                    onValueChange={(v) => setForm({ ...form, coordinator_id: v })}
                  >
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
                  <Select
                    value={form.main_teacher_id || ""}
                    onValueChange={(v) => setForm({ ...form, main_teacher_id: v })}
                  >
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
                  <Select
                    value={form.weekday || ""}
                    onValueChange={(v) => setForm({ ...form, weekday: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={form.start_time || ""}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={form.start_date || ""}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={form.end_date || ""}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Sala</Label>
                  <Input
                    placeholder="Ex: Sala 1"
                    value={form.room || ""}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Graduação ao Concluir</Label>
                  <Select
                    value={form.graduation_role || ""}
                    onValueChange={(v) => setForm({ ...form, graduation_role: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="estagiario">Estagiário</SelectItem>
                      <SelectItem value="trabalhador">Trabalhador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

      {coursesWithStatus.length === 0 ? (
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
          {coursesWithStatus.map((curso) => {
            const isEnrolled = myEnrollments?.has(curso.id);
            const isEnrolling = enrollingCourseId === curso.id;
            return (
            <Card
              key={curso.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => !isAluno && setSelectedCourse(curso)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{curso.name}</CardTitle>
                  <Badge variant="outline" className={statusVariant[curso.status] || ""}>{curso.status}</Badge>
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
                {isAluno && curso.status === "Ativo" && (
                  <Button
                    className="w-full"
                    variant={isEnrolled ? "outline" : "default"}
                    disabled={isEnrolled || isEnrolling}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnroll(curso.id);
                    }}
                  >
                    {isEnrolling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {isEnrolled ? "Já matriculado" : "Matricular-se"}
                  </Button>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {selectedCourse && !isAluno && (
        <CourseStudentsDialog
          course={selectedCourse}
          open={!!selectedCourse}
          onOpenChange={(open) => !open && setSelectedCourse(null)}
        />
      )}
    </div>
  );
}
