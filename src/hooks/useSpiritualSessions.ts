import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SessionService {
  id: string;
  service_type_id: string;
  people_count: number;
  service_type?: { id: string; name: string };
}

export interface SpiritualSession {
  id: string;
  session_date: string;
  start_time: string | null;
  responsible_name: string | null;
  observations: string | null;
  created_at: string;
  session_services: SessionService[];
}

export function useSpiritualSessions() {
  return useQuery({
    queryKey: ["spiritual-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spiritual_sessions")
        .select("*, session_services(*, service_types(id, name))")
        .order("session_date", { ascending: false });
      if (error) throw error;
      // flatten nested service_types
      return (data as any[]).map((s) => ({
        ...s,
        session_services: (s.session_services || []).map((ss: any) => ({
          ...ss,
          service_type: ss.service_types,
        })),
      })) as SpiritualSession[];
    },
  });
}

export interface CreateSessionInput {
  session_date: string;
  start_time?: string;
  responsible_name?: string;
  observations?: string;
  services: { service_type_id: string; people_count: number }[];
}

export function useCreateSpiritualSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const { data: session, error } = await supabase
        .from("spiritual_sessions")
        .insert({
          session_date: input.session_date,
          start_time: input.start_time || null,
          responsible_name: input.responsible_name || null,
          observations: input.observations || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.services.length > 0) {
        const rows = input.services.map((s) => ({
          session_id: session.id,
          service_type_id: s.service_type_id,
          people_count: s.people_count,
        }));
        const { error: svcErr } = await supabase
          .from("session_services")
          .insert(rows);
        if (svcErr) throw svcErr;
      }

      return session;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spiritual-sessions"] }),
  });
}
