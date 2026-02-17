import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Worker = Tables<"workers">;
export type WorkerInsert = TablesInsert<"workers">;

export function useWorkersList() {
  return useQuery({
    queryKey: ["workers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (worker: WorkerInsert) => {
      const { data, error } = await supabase
        .from("workers")
        .insert(worker)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers-list"] });
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}
