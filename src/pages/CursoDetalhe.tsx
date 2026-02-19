import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, BookOpen, Users, Loader2, Save, Trash2, FileText,
  Link as LinkIcon, Type, Upload, Download, ExternalLink, CalendarDays, GripVertical,
  Check, X, MessageSquare,
} from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useCourseStudents } from "@/hooks/useCourseStudents";
import { useCourseLessons, useCreateLesson, useUpdateLesson, useDeleteLesson, useLessonMaterials, useAddMaterial, useDeleteMaterial, uploadCourseMaterial } from "@/hooks/useCourseLessons";
import { useCourseAttendance, useSaveCourseAttendance, useCourseAttendanceByMember, useSubmitJustification, useUpdateJustificationStatus } from "@/hooks/useCourseAttendance";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { toast } from "sonner";
import type { CourseLesson } from "@/hooks/useCourseLessons";

export default function CursoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, isAdminOrDiretor } = useCurrentUserRole();

  const { data: courses, isLoading: loadingCourse } = useCourses();
  const course = courses?.find((c) => c.id === id);

  const isTeacherOrCoordinator = !!course && !!user && (
    course.main_teacher_id === user.id ||
    course.coordinator_id === user.id ||
    (course.assistant_ids || []).includes(user.id)
  );
  const canManage = isAdminOrDiretor || isTeacherOrCoordinator;
  const isAluno = role === "aluno";

  const { data: lessons = [], isLoading: loadingLessons } = useCourseLessons(id || null);
  const { data: students = [] } = useCourseStudents(id || null);
  const activeStudents = students.filter((s: any) => s.status === "ATIVO");

  // Get current user's member_id (for student view)
  const { data: myMember } = useQuery({
    queryKey: ["my-member", user?.email],
    enabled: !!user?.email,
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

  // Fetch pending justifications count per date for this course
  const { data: pendingByDate = {} } = useQuery({
    queryKey: ["pending-justifications", id],
    enabled: canManage && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_attendance")
        .select("date")
        .eq("course_id", id!)
        .eq("justification_status", "PENDENTE");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((r) => { counts[r.date] = (counts[r.date] || 0) + 1; });
      return counts;
    },
  });

  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [newLessonOpen, setNewLessonOpen] = useState(false);

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/cursos")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <p className="text-center text-muted-foreground py-12">Curso não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cursos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{course.name}</h1>
            <Badge variant="secondary">N{course.level}</Badge>
            <Badge variant="outline">{course.status}</Badge>
          </div>
          {course.description && (
            <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="aulas">
        <TabsList>
          <TabsTrigger value="aulas">
            <BookOpen className="mr-2 h-4 w-4" /> Aulas
          </TabsTrigger>
          <TabsTrigger value="alunos">
            <Users className="mr-2 h-4 w-4" /> Alunos ({activeStudents.length})
          </TabsTrigger>
        </TabsList>

        {/* AULAS TAB */}
        <TabsContent value="aulas" className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <Button onClick={() => setNewLessonOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova Aula
              </Button>
            </div>
          )}

          {loadingLessons ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : lessons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">Nenhuma aula cadastrada</p>
                <p className="text-sm text-muted-foreground">
                  {canManage ? 'Clique em "Nova Aula" para começar' : "Aguarde o professor adicionar aulas"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {lessons.map((lesson, idx) => {
                const pendingCount = lesson.lesson_date ? (pendingByDate[lesson.lesson_date] || 0) : 0;
                return (
                  <Card
                    key={lesson.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{lesson.title}</p>
                          {canManage && pendingCount > 0 && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                              <MessageSquare className="mr-1 h-3 w-3" />
                              {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
                        )}
                      </div>
                      {lesson.lesson_date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(lesson.lesson_date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ALUNOS TAB */}
        <TabsContent value="alunos">
          {activeStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum aluno ativo neste curso</p>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStudents.map((s: any) => (
                    <TableRow key={s.member_id}>
                      <TableCell className="font-medium text-foreground">{s.members?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{s.members?.email || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* New Lesson Dialog */}
      {newLessonOpen && (
        <NewLessonDialog
          courseId={course.id}
          lessonCount={lessons.length}
          open={newLessonOpen}
          onOpenChange={setNewLessonOpen}
        />
      )}

      {/* Lesson Detail Dialog */}
      {selectedLesson && (
        <LessonDetailDialog
          lesson={selectedLesson}
          courseId={course.id}
          canManage={canManage}
          isAluno={isAluno}
          myMemberId={myMember?.id || null}
          activeStudents={activeStudents}
          open={!!selectedLesson}
          onOpenChange={(o) => !o && setSelectedLesson(null)}
        />
      )}
    </div>
  );
}

// --- New Lesson Dialog ---
function NewLessonDialog({ courseId, lessonCount, open, onOpenChange }: {
  courseId: string; lessonCount: number; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const createLesson = useCreateLesson();

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Informe o título da aula"); return; }
    try {
      await createLesson.mutateAsync({
        course_id: courseId,
        title: title.trim(),
        description: description || undefined,
        lesson_date: date || undefined,
        lesson_order: lessonCount + 1,
      });
      toast.success("Aula criada!");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar aula");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Aula</DialogTitle>
          <DialogDescription>Adicione uma nova aula ao curso</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input placeholder="Ex: Aula 1 - Introdução" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Descrição (opcional)</Label>
            <Textarea placeholder="Descreva o conteúdo da aula..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Data da Aula (opcional)</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={createLesson.isPending}>
            {createLesson.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Aula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Lesson Detail Dialog ---
function LessonDetailDialog({ lesson, courseId, canManage, isAluno, myMemberId, activeStudents, open, onOpenChange }: {
  lesson: CourseLesson;
  courseId: string;
  canManage: boolean;
  isAluno: boolean;
  myMemberId: string | null;
  activeStudents: any[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [tab, setTab] = useState<"materiais" | "presenca">("materiais");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {lesson.title}
          </DialogTitle>
          {lesson.description && (
            <DialogDescription>{lesson.description}</DialogDescription>
          )}
          {lesson.lesson_date && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(lesson.lesson_date + "T12:00:00").toLocaleDateString("pt-BR")}
            </p>
          )}
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="shrink-0">
            <TabsTrigger value="materiais">
              <FileText className="mr-1 h-4 w-4" /> Materiais
            </TabsTrigger>
            <TabsTrigger value="presenca">
              <CalendarDays className="mr-1 h-4 w-4" /> Presença
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materiais" className="flex-1 overflow-y-auto">
            <MaterialsSection lessonId={lesson.id} courseId={courseId} canManage={canManage} />
          </TabsContent>

          <TabsContent value="presenca" className="flex-1 overflow-y-auto">
            {canManage ? (
              <AttendanceSection
                courseId={courseId}
                lessonDate={lesson.lesson_date || new Date().toISOString().slice(0, 10)}
                activeStudents={activeStudents}
              />
            ) : (
              <StudentAttendanceSection
                courseId={courseId}
                lessonDate={lesson.lesson_date || new Date().toISOString().slice(0, 10)}
                myMemberId={myMemberId}
              />
            )}
          </TabsContent>
        </Tabs>

        {canManage && (
          <div className="flex justify-between items-center pt-2 border-t shrink-0">
            <DeleteLessonButton lessonId={lesson.id} courseId={courseId} onDeleted={() => onOpenChange(false)} />
            <div />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Materials Section ---
function MaterialsSection({ lessonId, courseId, canManage }: { lessonId: string; courseId: string; canManage: boolean }) {
  const { data: materials = [], isLoading } = useLessonMaterials(lessonId);
  const addMaterial = useAddMaterial();
  const deleteMaterial = useDeleteMaterial();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addType, setAddType] = useState<"file" | "link" | "text" | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadCourseMaterial(file, courseId, lessonId);
      await addMaterial.mutateAsync({
        lesson_id: lessonId,
        title: file.name,
        type: "file",
        content: url,
        file_name: file.name,
        file_size: file.size,
      });
      toast.success("Arquivo enviado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) { toast.error("Informe a URL"); return; }
    try {
      await addMaterial.mutateAsync({
        lesson_id: lessonId,
        title: linkTitle.trim() || linkUrl.trim(),
        type: "link",
        content: linkUrl.trim(),
      });
      toast.success("Link adicionado!");
      setAddType(null);
      setLinkUrl("");
      setLinkTitle("");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    }
  };

  const handleAddText = async () => {
    if (!textContent.trim()) { toast.error("Informe o conteúdo"); return; }
    try {
      await addMaterial.mutateAsync({
        lesson_id: lessonId,
        title: textTitle.trim() || "Texto",
        type: "text",
        content: textContent.trim(),
      });
      toast.success("Texto adicionado!");
      setAddType(null);
      setTextContent("");
      setTextTitle("");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      await deleteMaterial.mutateAsync({ id: materialId, lessonId });
      toast.success("Material removido!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 py-2">
      {/* Add buttons */}
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
            Arquivo
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAddType("link")}>
            <LinkIcon className="mr-1 h-3 w-3" /> Link
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAddType("text")}>
            <Type className="mr-1 h-3 w-3" /> Texto
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
        </div>
      )}

      {/* Add link form */}
      {addType === "link" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid gap-2">
              <Label>Título (opcional)</Label>
              <Input placeholder="Ex: Vídeo da aula" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>URL</Label>
              <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddLink} disabled={addMaterial.isPending}>Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddType(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add text form */}
      {addType === "text" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid gap-2">
              <Label>Título (opcional)</Label>
              <Input placeholder="Ex: Resumo da aula" value={textTitle} onChange={(e) => setTextTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Conteúdo</Label>
              <Textarea rows={4} placeholder="Digite o conteúdo..." value={textContent} onChange={(e) => setTextContent(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddText} disabled={addMaterial.isPending}>Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddType(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials list */}
      {materials.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">Nenhum material adicionado</p>
      ) : (
        <div className="space-y-2">
          {materials.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="shrink-0">
                  {m.type === "file" && <FileText className="h-5 w-5 text-primary" />}
                  {m.type === "link" && <LinkIcon className="h-5 w-5 text-primary" />}
                  {m.type === "text" && <Type className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{m.title}</p>
                  {m.type === "text" && m.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{m.content}</p>
                  )}
                  {m.type === "file" && m.file_size && (
                    <p className="text-xs text-muted-foreground">{(m.file_size / 1024).toFixed(0)} KB</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(m.type === "file" || m.type === "link") && m.content && (
                    <Button size="icon" variant="ghost" asChild>
                      <a href={m.content} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {canManage && (
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Attendance Section (teacher view inside lesson) ---
function AttendanceSection({ courseId, lessonDate, activeStudents }: {
  courseId: string; lessonDate: string; activeStudents: any[];
}) {
  const { data: attendance = [], isLoading } = useCourseAttendance(courseId, lessonDate);
  const saveAttendance = useSaveCourseAttendance();
  const updateJustStatus = useUpdateJustificationStatus();

  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);

  if (!initialized && !isLoading) {
    const map: Record<string, boolean> = {};
    activeStudents.forEach((s: any) => {
      const record = attendance.find((a: any) => a.member_id === s.member_id);
      map[s.member_id] = record ? record.present : true;
    });
    setPresenceMap(map);
    setInitialized(true);
  }

  const togglePresence = (memberId: string) => {
    setPresenceMap((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const handleSave = async () => {
    const records = Object.entries(presenceMap).map(([member_id, present]) => ({ member_id, present }));
    try {
      await saveAttendance.mutateAsync({ courseId, date: lessonDate, records });
      toast.success("Presença salva!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar presença");
    }
  };

  const handleJustification = async (attendanceId: string, status: "ACEITA" | "REJEITADA") => {
    try {
      await updateJustStatus.mutateAsync({ attendanceId, status });
      toast.success(status === "ACEITA" ? "Justificativa aceita!" : "Justificativa rejeitada.");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    }
  };

  const presentCount = Object.values(presenceMap).filter(Boolean).length;

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  if (activeStudents.length === 0) {
    return <p className="text-center text-muted-foreground py-6">Nenhum aluno ativo neste curso</p>;
  }

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{presentCount}/{activeStudents.length} presentes</p>
        <Button size="sm" onClick={handleSave} disabled={saveAttendance.isPending}>
          {saveAttendance.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
          Salvar
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">✓</TableHead>
            <TableHead>Aluno</TableHead>
            <TableHead>Justificativa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeStudents.map((s: any) => {
            const record = attendance.find((a: any) => a.member_id === s.member_id);
            const hasJustification = record?.justification && record?.justification_status;
            return (
              <TableRow key={s.member_id}>
                <TableCell className="cursor-pointer" onClick={() => togglePresence(s.member_id)}>
                  <Checkbox checked={presenceMap[s.member_id] ?? true} onCheckedChange={() => togglePresence(s.member_id)} />
                </TableCell>
                <TableCell className="cursor-pointer" onClick={() => togglePresence(s.member_id)}>
                  <p className="font-medium text-foreground">{s.members?.name || "—"}</p>
                </TableCell>
                <TableCell>
                  {hasJustification ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground line-clamp-2">{record.justification}</p>
                      {record.justification_status === "PENDENTE" ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => handleJustification(record.id, "ACEITA")}>
                            <Check className="mr-1 h-3 w-3" /> Aceitar
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => handleJustification(record.id, "REJEITADA")}>
                            <X className="mr-1 h-3 w-3" /> Rejeitar
                          </Button>
                        </div>
                      ) : (
                        <Badge variant={record.justification_status === "ACEITA" ? "default" : "destructive"} className="text-xs">
                          {record.justification_status === "ACEITA" ? "Aceita" : "Rejeitada"}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// --- Student Attendance Section (student view) ---
function StudentAttendanceSection({ courseId, lessonDate, myMemberId }: {
  courseId: string; lessonDate: string; myMemberId: string | null;
}) {
  const { data: attendance = [], isLoading } = useCourseAttendance(courseId, lessonDate);
  const submitJustification = useSubmitJustification();
  const [justText, setJustText] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (!myMemberId) {
    return <p className="text-center text-muted-foreground py-6">Seu cadastro de membro não foi encontrado.</p>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  const myRecord = attendance.find((a: any) => a.member_id === myMemberId);

  if (!myRecord) {
    return <p className="text-center text-muted-foreground py-6">Presença ainda não registrada para esta aula.</p>;
  }

  const handleSubmit = async () => {
    if (!justText.trim()) { toast.error("Escreva sua justificativa"); return; }
    try {
      await submitJustification.mutateAsync({ attendanceId: myRecord.id, justification: justText.trim() });
      toast.success("Justificativa enviada!");
      setShowForm(false);
      setJustText("");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar justificativa");
    }
  };

  return (
    <div className="space-y-4 py-2">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${myRecord.present ? "bg-primary/10" : "bg-destructive/10"}`}>
              {myRecord.present ? (
                <Check className="h-5 w-5 text-primary" />
              ) : (
                <X className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {myRecord.present ? "Presente" : "Ausente"}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(lessonDate + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Show justification status if exists */}
          {myRecord.justification && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Sua justificativa</span>
              </div>
              <p className="text-sm text-muted-foreground">{myRecord.justification}</p>
              {myRecord.justification_status && (
                <Badge variant={
                  myRecord.justification_status === "ACEITA" ? "default" :
                  myRecord.justification_status === "REJEITADA" ? "destructive" : "secondary"
                }>
                  {myRecord.justification_status === "ACEITA" ? "Aceita" :
                   myRecord.justification_status === "REJEITADA" ? "Rejeitada" : "Pendente"}
                </Badge>
              )}
            </div>
          )}

          {/* Allow justification only when absent, no justification yet, and within 2 days */}
          {!myRecord.present && !myRecord.justification && !showForm && (() => {
            const lessonMs = new Date(lessonDate + "T23:59:59").getTime();
            const withinDeadline = Date.now() <= lessonMs + 2 * 24 * 60 * 60 * 1000;
            return withinDeadline ? (
              <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                <MessageSquare className="mr-1 h-3 w-3" /> Enviar Justificativa
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Prazo para justificativa expirado (até 2 dias após a aula).</p>
            );
          })()}

          {showForm && (
            <div className="border-t pt-3 space-y-3">
              <Label>Justificativa da ausência</Label>
              <Textarea
                placeholder="Explique o motivo da sua ausência..."
                value={justText}
                onChange={(e) => setJustText(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmit} disabled={submitJustification.isPending}>
                  {submitJustification.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Enviar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setJustText(""); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Delete Lesson Button ---
function DeleteLessonButton({ lessonId, courseId, onDeleted }: { lessonId: string; courseId: string; onDeleted: () => void }) {
  const deleteLesson = useDeleteLesson();
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteLesson.mutateAsync({ id: lessonId, course_id: courseId });
      toast.success("Aula excluída!");
      onDeleted();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir aula");
    }
  };

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-destructive">Excluir aula?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleteLesson.isPending}>
          {deleteLesson.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Não</Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>
      <Trash2 className="mr-1 h-3 w-3 text-destructive" /> Excluir Aula
    </Button>
  );
}
