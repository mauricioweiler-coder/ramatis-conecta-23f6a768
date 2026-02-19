import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("workers")
        .select("id, full_name, profile_photo_url")
        .eq("status", "ATIVO")
        .not("profile_photo_url", "is", null);

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const { worker_id } = await req.json();

      if (!worker_id) {
        return new Response(
          JSON.stringify({ error: "worker_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get worker info
      const { data: worker } = await supabase
        .from("workers")
        .select("id, full_name")
        .eq("id", worker_id)
        .single();

      if (!worker) {
        return new Response(
          JSON.stringify({ error: "Trabalhador não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check today
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // Check if already registered today
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("member_id", worker_id)
        .gte("date", `${today}T00:00:00`)
        .lte("date", `${today}T23:59:59`);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({
            error: "Presença já registrada hoje",
            already_registered: true,
            worker_name: worker.full_name,
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find today's spiritual session within 2h window
      const { data: sessions } = await supabase
        .from("spiritual_sessions")
        .select("id, session_date, start_time")
        .eq("session_date", today);

      let matchedSessionId: string | null = null;

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          if (session.start_time) {
            const [hours, minutes] = session.start_time.split(":").map(Number);
            const sessionTime = new Date(`${today}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
            const diffMs = sessionTime.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            // Up to 2 hours before, or up to 30min after start
            if (diffHours >= -0.5 && diffHours <= 2) {
              matchedSessionId = session.id;
              break;
            }
          } else {
            matchedSessionId = session.id;
          }
        }
      }

      // Register attendance
      const { data: attendance, error: insertError } = await supabase
        .from("attendance")
        .insert({
          member_id: worker_id,
          member_name: worker.full_name,
          activity_type: "Palestra",
          spiritual_session_id: matchedSessionId,
          notes: matchedSessionId
            ? "Presença registrada por reconhecimento facial"
            : "Presença registrada por reconhecimento facial (sem palestra vinculada)",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({
          success: true,
          worker_name: worker.full_name,
          session_linked: !!matchedSessionId,
          attendance,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  } catch (e) {
    console.error("registro-presenca error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
