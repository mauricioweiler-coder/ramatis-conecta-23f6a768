import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AssistanceRecord = Tables<"assistance_records">;
export type AssistanceRecordInsert = TablesInsert<"assistance_records">;
export type AssistanceRecordUpdate = TablesUpdate<"assistance_records">;

export function useAssistanceRecords() {
  return useQuery({
    queryKey: ["assistance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assistance_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAssistanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: AssistanceRecordInsert) => {
      const { data, error } = await supabase
        .from("assistance_records")
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistance-records"] });
    },
  });
}

export function useUpdateAssistanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: AssistanceRecordUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("assistance_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistance-records"] });
    },
  });
}
