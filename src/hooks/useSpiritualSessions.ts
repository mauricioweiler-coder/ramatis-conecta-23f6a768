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
  speaker_name: string | null;
  responsible_id: string | null;
  speaker_id: string | null;
  observations: string | null;
  created_at: string;
  session_services: SessionService[];
  workers_present: number;
  // Joined worker data
  responsible_worker?: { id: string; full_name: string } | null;
  speaker_worker?: { id: string; full_name: string } | null;
}

export function useSpiritualSessions() {
  return useQuery({
    queryKey: ["spiritual-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spiritual_sessions")
        .select("*, session_services(*, service_types(id, name)), responsible_worker:workers!spiritual_sessions_responsible_id_fkey(id, full_name), speaker_worker:workers!spiritual_sessions_speaker_id_fkey(id, full_name)")
        .order("session_date", { ascending: false });
      if (error) throw error;

      // Fetch attendance counts per session
      const sessionIds = (data || []).map((s: any) => s.id);
      let attendanceCounts: Record<string, number> = {};
      if (sessionIds.length > 0) {
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("spiritual_session_id")
          .in("spiritual_session_id", sessionIds);
        if (attendanceData) {
          for (const a of attendanceData) {
            const sid = (a as any).spiritual_session_id;
            if (sid) attendanceCounts[sid] = (attendanceCounts[sid] || 0) + 1;
          }
        }
      }

      return (data as any[]).map((s) => ({
        ...s,
        session_services: (s.session_services || []).map((ss: any) => ({
          ...ss,
          service_type: ss.service_types,
        })),
        workers_present: attendanceCounts[s.id] || 0,
      })) as SpiritualSession[];
    },
  });
}

export interface CreateSessionInput {
  session_date: string;
  start_time?: string;
  responsible_id?: string;
  speaker_id?: string;
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
          responsible_id: input.responsible_id || null,
          speaker_id: input.speaker_id || null,
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

export interface UpdateSessionInput {
  id: string;
  session_date?: string;
  start_time?: string;
  responsible_id?: string;
  speaker_id?: string;
  observations?: string;
  services: { service_type_id: string; people_count: number }[];
}

export function useUpdateSpiritualSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSessionInput) => {
      const { id, services, ...updates } = input;
      const { error } = await supabase
        .from("spiritual_sessions")
        .update({
          session_date: updates.session_date,
          start_time: updates.start_time || null,
          responsible_id: updates.responsible_id || null,
          speaker_id: updates.speaker_id || null,
          observations: updates.observations || null,
        })
        .eq("id", id);
      if (error) throw error;

      const { error: delErr } = await supabase
        .from("session_services")
        .delete()
        .eq("session_id", id);
      if (delErr) throw delErr;

      if (services.length > 0) {
        const rows = services.map((s) => ({
          session_id: id,
          service_type_id: s.service_type_id,
          people_count: s.people_count,
        }));
        const { error: insErr } = await supabase
          .from("session_services")
          .insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spiritual-sessions"] }),
  });
}
