import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  mode: string;
  created_at: string;
}

export function useServiceTypes(onlyActive = false, mode?: "coletivo" | "individual") {
  return useQuery({
    queryKey: ["service-types", onlyActive, mode],
    queryFn: async () => {
      let query = supabase.from("service_types").select("*").order("name");
      if (onlyActive) query = query.eq("active", true);
      if (mode) query = query.eq("mode", mode);
      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceType[];
    },
  });
}

export function useCreateServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; mode?: string }) => {
      const { data, error } = await supabase
        .from("service_types")
        .insert({ name: input.name, description: input.description || null, mode: input.mode || "coletivo" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-types"] }),
  });
}

export function useToggleServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("service_types")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-types"] }),
  });
}
