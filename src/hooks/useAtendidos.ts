import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Atendido = Tables<"atendidos">;
export type AtendidoInsert = TablesInsert<"atendidos">;
export type AtendidoUpdate = TablesUpdate<"atendidos">;

export function useAtendidos() {
  return useQuery({
    queryKey: ["atendidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendidos")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useSearchAtendidos(search: string) {
  return useQuery({
    queryKey: ["atendidos", "search", search],
    queryFn: async () => {
      let query = supabase.from("atendidos").select("*").order("name");
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,cpf.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });
}

export function useCreateAtendido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: AtendidoInsert) => {
      const { data, error } = await supabase
        .from("atendidos")
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atendidos"] }),
  });
}

export function useUpdateAtendido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: AtendidoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("atendidos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atendidos"] }),
  });
}
