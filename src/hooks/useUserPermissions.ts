import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ModuleName = "colaboradores" | "financeiro" | "cursos" | "atendimentos" | "presenca";

export interface UserPermission {
  id: string;
  user_id: string;
  module: ModuleName;
  can_view: boolean;
  can_edit: boolean;
}

export const MODULE_LABELS: Record<ModuleName, string> = {
  colaboradores: "Colaboradores",
  financeiro: "Financeiro",
  cursos: "Cursos",
  atendimentos: "Atendimentos",
  presenca: "Presença",
};

export const ALL_MODULES: ModuleName[] = ["colaboradores", "financeiro", "cursos", "atendimentos", "presenca"];

// Route to module mapping
const ROUTE_MODULE_MAP: Record<string, ModuleName> = {
  "/colaboradores": "colaboradores",
  "/financeiro": "financeiro",
  "/cursos": "cursos",
  "/atendimento": "atendimentos",
  "/atendimentos": "atendimentos",
  "/presenca": "presenca",
};

export function routeToModule(route: string): ModuleName | null {
  // Exact match first
  if (ROUTE_MODULE_MAP[route]) return ROUTE_MODULE_MAP[route];
  // Check if route starts with any mapped prefix (e.g. /cursos/123 → cursos)
  for (const [path, mod] of Object.entries(ROUTE_MODULE_MAP)) {
    if (route.startsWith(path + "/")) return mod;
  }
  return null;
}

/** Get current user's own permissions */
export function useMyPermissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as UserPermission[];
    },
    enabled: !!user?.id,
  });
}

/** Get all permissions for all users (admin only) */
export function useAllPermissions() {
  return useQuery({
    queryKey: ["all-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*");
      if (error) throw error;
      return data as UserPermission[];
    },
  });
}

/** Upsert a permission for a user */
export function useUpsertPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { user_id: string; module: ModuleName; can_view: boolean; can_edit: boolean }) => {
      const { data, error } = await supabase
        .from("user_permissions")
        .upsert(
          { user_id: input.user_id, module: input.module, can_view: input.can_view, can_edit: input.can_edit },
          { onConflict: "user_id,module" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-permissions"] });
      qc.invalidateQueries({ queryKey: ["my-permissions"] });
    },
  });
}
