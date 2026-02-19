import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCourseAttendance(courseId: string | null, date: string) {
  return useQuery({
    queryKey: ["course-attendance", courseId, date],
    enabled: !!courseId && !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_attendance")
        .select("*, members(id, name)")
        .eq("course_id", courseId!)
        .eq("date", date);
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveCourseAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      courseId,
      date,
      records,
    }: {
      courseId: string;
      date: string;
      records: { member_id: string; present: boolean; notes?: string }[];
    }) => {
      // Delete existing records for this course/date, then insert new ones
      await supabase
        .from("course_attendance")
        .delete()
        .eq("course_id", courseId)
        .eq("date", date);

      if (records.length > 0) {
        const { error } = await supabase.from("course_attendance").insert(
          records.map((r) => ({
            course_id: courseId,
            date,
            member_id: r.member_id,
            present: r.present,
            notes: r.notes || null,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["course-attendance", vars.courseId] });
    },
  });
}

export function useCourseAttendanceDates(courseId: string | null) {
  return useQuery({
    queryKey: ["course-attendance-dates", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_attendance")
        .select("date")
        .eq("course_id", courseId!)
        .order("date", { ascending: false });
      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.date))];
      return unique;
    },
  });
}
