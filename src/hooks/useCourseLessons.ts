import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  lesson_date: string | null;
  lesson_order: number;
  created_at: string;
  updated_at: string;
}

export interface CourseLessonMaterial {
  id: string;
  lesson_id: string;
  title: string;
  type: string; // 'file' | 'link' | 'text'
  content: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

export function useCourseLessons(courseId: string | null) {
  return useQuery({
    queryKey: ["course-lessons", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId!)
        .order("lesson_order", { ascending: true });
      if (error) throw error;
      return data as CourseLesson[];
    },
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lesson: { course_id: string; title: string; description?: string; lesson_date?: string; lesson_order: number }) => {
      const { data, error } = await supabase
        .from("course_lessons")
        .insert(lesson)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["course-lessons", vars.course_id] });
    },
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, course_id, ...updates }: Partial<CourseLesson> & { id: string; course_id: string }) => {
      const { error } = await supabase
        .from("course_lessons")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["course-lessons", vars.course_id] });
    },
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, course_id }: { id: string; course_id: string }) => {
      const { error } = await supabase.from("course_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["course-lessons", vars.course_id] });
    },
  });
}

// Materials
export function useLessonMaterials(lessonId: string | null) {
  return useQuery({
    queryKey: ["lesson-materials", lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lesson_materials")
        .select("*")
        .eq("lesson_id", lessonId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as CourseLessonMaterial[];
    },
  });
}

export function useAddMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (material: { lesson_id: string; title: string; type: string; content?: string; file_name?: string; file_size?: number }) => {
      const { data, error } = await supabase
        .from("course_lesson_materials")
        .insert(material)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["lesson-materials", vars.lesson_id] });
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lessonId }: { id: string; lessonId: string }) => {
      const { error } = await supabase.from("course_lesson_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["lesson-materials", vars.lessonId] });
    },
  });
}

export async function uploadCourseMaterial(file: File, courseId: string, lessonId: string) {
  const ext = file.name.split(".").pop();
  const path = `${courseId}/${lessonId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("course-materials").upload(path, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("course-materials").getPublicUrl(path);
  return { url: urlData.publicUrl, path };
}
