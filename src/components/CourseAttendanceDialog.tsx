import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Loader2, Save } from "lucide-react";
import { useCourseStudents } from "@/hooks/useCourseStudents";
import { useCourseAttendance, useSaveCourseAttendance, useCourseAttendanceDates } from "@/hooks/useCourseAttendance";
import { toast } from "sonner";
import type { Course } from "@/hooks/useCourses";

interface Props {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseAttendanceDialog({ course, open, onOpenChange }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const { data: students = [], isLoading: loadingStudents } = useCourseStudents(open ? course.id : null);
  const { data: attendance = [], isLoading: loadingAttendance } = useCourseAttendance(open ? course.id : null, date);
  const { data: pastDates = [] } = useCourseAttendanceDates(open ? course.id : null);
  const saveAttendance = useSaveCourseAttendance();

  // Only active students
  const activeStudents = students.filter((s: any) => s.status === "ATIVO");

  // Build attendance map from existing records
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const map: Record<string, boolean> = {};
    activeStudents.forEach((s: any) => {
      const record = attendance.find((a: any) => a.member_id === s.member_id);
      map[s.member_id] = record ? record.present : true; // default present
    });
    setPresenceMap(map);
  }, [attendance, students, date]);

  const togglePresence = (memberId: string) => {
    setPresenceMap((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const handleSave = async () => {
    const records = Object.entries(presenceMap).map(([member_id, present]) => ({
      member_id,
      present,
    }));
    try {
      await saveAttendance.mutateAsync({ courseId: course.id, date, records });
      toast.success("Presença salva!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar presença");
    }
  };

  const presentCount = Object.values(presenceMap).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Presença — {course.name}
          </DialogTitle>
          <DialogDescription>
            Registre a presença dos alunos para a data selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="grid gap-2">
            <Label>Data da Aula</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          </div>
          {pastDates.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {pastDates.length} registro(s) de presença anteriores
            </div>
          )}
        </div>

        {loadingStudents || loadingAttendance ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activeStudents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum aluno ativo neste curso</p>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              {presentCount}/{activeStudents.length} presentes
            </div>
            <div className="max-h-[40vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">✓</TableHead>
                    <TableHead>Aluno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStudents.map((s: any) => (
                    <TableRow key={s.member_id} className="cursor-pointer" onClick={() => togglePresence(s.member_id)}>
                      <TableCell>
                        <Checkbox
                          checked={presenceMap[s.member_id] ?? true}
                          onCheckedChange={() => togglePresence(s.member_id)}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{s.members?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{s.members?.email || ""}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saveAttendance.isPending}>
                {saveAttendance.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Presença
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
