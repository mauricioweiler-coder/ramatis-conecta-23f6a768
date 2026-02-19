import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Course = Tables<"courses">;
export type CourseInsert = TablesInsert<"courses">;

export function useCourses(level?: number) {
  return useQuery({
    queryKey: ["courses", level],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (level !== undefined) {
        query = query.eq("level", level);
      }
      const { data, error } = await query;
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

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Course> & { id: string }) => {
      const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", id)
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

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course-student-counts"] });
    },
  });
}
