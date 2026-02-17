import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = `${today.slice(0, 7)}-01`;

      const [workers, attendance, transactions, courses, courseStudents, assistance] = await Promise.all([
        supabase.from("workers").select("id, status"),
        supabase.from("attendance").select("id, member_name, date").gte("date", `${today}T00:00:00`).lte("date", `${today}T23:59:59`).order("date", { ascending: false }),
        supabase.from("transactions").select("id, type, amount, description, date").gte("date", `${monthStart}T00:00:00`).order("date", { ascending: false }),
        supabase.from("courses").select("id, name, start_date, end_date"),
        supabase.from("course_students").select("id, course_id"),
        supabase.from("assistance_records").select("id, visitor_name, status, created_at").order("created_at", { ascending: false }),
      ]);

      const workersData = workers.data || [];
      const attendanceData = attendance.data || [];
      const transactionsData = transactions.data || [];
      const coursesData = courses.data || [];
      const courseStudentsData = courseStudents.data || [];
      const assistanceData = assistance.data || [];

      const activeWorkers = workersData.filter((w) => w.status === "ATIVO").length;
      const todayAttendance = attendanceData.length;

      const receitas = transactionsData.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
      const despesas = transactionsData.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);

      const now = new Date();
      const activeCourses = coursesData.filter((c) => {
        const start = c.start_date ? new Date(c.start_date) : null;
        const end = c.end_date ? new Date(c.end_date) : null;
        return start && start <= now && (!end || end >= now);
      });

      const pendingAssistance = assistanceData.filter((a) => a.status === "AGUARDANDO").length;

      // Recent activity: merge latest from each source
      const recentItems: { text: string; time: string; date: Date }[] = [];

      attendanceData.slice(0, 3).forEach((a) => {
        recentItems.push({ text: `${a.member_name || "Colaborador"} registrou presença`, time: a.date, date: new Date(a.date) });
      });

      transactionsData.slice(0, 3).forEach((t) => {
        const prefix = t.type === "entrada" ? "Receita" : "Despesa";
        recentItems.push({ text: `${prefix}: ${t.description}`, time: t.date, date: new Date(t.date) });
      });

      assistanceData.slice(0, 3).forEach((a) => {
        recentItems.push({ text: `Atendimento: ${a.visitor_name}`, time: a.created_at, date: new Date(a.created_at) });
      });

      recentItems.sort((a, b) => b.date.getTime() - a.date.getTime());

      return {
        activeWorkers,
        totalWorkers: workersData.length,
        todayAttendance,
        receitas,
        despesas,
        saldo: receitas - despesas,
        activeCourses: activeCourses.length,
        totalStudents: courseStudentsData.length,
        pendingAssistance,
        recentActivity: recentItems.slice(0, 5),
      };
    },
  });
}
