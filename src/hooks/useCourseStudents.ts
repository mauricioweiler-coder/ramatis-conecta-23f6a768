import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCourseStudents(courseId: string | null) {
  return useQuery({
    queryKey: ["course-students", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_students")
        .select("*, members(id, name, email, role)")
        .eq("course_id", courseId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, memberId }: { courseId: string; memberId: string }) => {
      const { data, error } = await supabase
        .from("course_students")
        .insert({ course_id: courseId, member_id: memberId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["course-students", vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-student-counts"] });
    },
  });
}

export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, courseId }: { id: string; status: string; courseId: string }) => {
      const { error } = await supabase
        .from("course_students")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["course-students", vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-student-counts"] });
    },
  });
}

export function useMembers() {
  return useQuery({
    queryKey: ["members-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, email")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}
