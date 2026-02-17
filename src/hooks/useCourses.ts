import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Course = Tables<"courses">;
export type CourseInsert = TablesInsert<"courses">;

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCourseStudentCounts() {
  return useQuery({
    queryKey: ["course-student-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_students")
        .select("course_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((s) => {
        counts[s.course_id] = (counts[s.course_id] || 0) + 1;
      });
      return counts;
    },
  });
}

export function useWorkers() {
  return useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workers")
        .select("id, full_name")
        .eq("status", "ATIVO")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (course: CourseInsert) => {
      const { data, error } = await supabase
        .from("courses")
        .insert(course)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
