import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Attendance = Tables<"attendance">;
export type AttendanceInsert = TablesInsert<"attendance">;

export function useAttendanceToday() {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["attendance-today", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .gte("date", `${today}T00:00:00`)
        .lte("date", `${today}T23:59:59`)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: AttendanceInsert) => {
      const { data, error } = await supabase
        .from("attendance")
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
    },
  });
}
