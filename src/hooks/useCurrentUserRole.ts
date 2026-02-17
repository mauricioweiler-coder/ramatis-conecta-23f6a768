import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "diretor" | "trabalhador" | "professor" | "estagiario" | "aluno";

// Access matrix: which roles can access which routes
const ROUTE_ACCESS: Record<string, AppRole[]> = {
  "/": ["admin", "diretor", "trabalhador", "professor", "estagiario", "aluno"],
  "/colaboradores": ["admin", "diretor", "trabalhador", "professor", "estagiario"],
  "/financeiro": ["admin", "diretor"],
  "/cursos": ["admin", "diretor", "trabalhador", "professor", "estagiario", "aluno"],
  "/atendimento": ["admin", "diretor", "trabalhador", "professor", "estagiario"],
  "/presenca": ["admin", "diretor", "trabalhador", "professor", "estagiario"],
  "/gestao-roles": ["admin", "diretor"],
  "/meu-perfil": ["admin", "diretor", "trabalhador", "professor", "estagiario", "aluno"],
};

export function useCurrentUserRole() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["current-user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as AppRole) || "aluno";
    },
    enabled: !!user?.id,
  });

  const role = query.data ?? "aluno";

  const canAccess = (route: string): boolean => {
    const allowed = ROUTE_ACCESS[route];
    if (!allowed) return true; // unknown routes are open
    return allowed.includes(role);
  };

  const isAdmin = role === "admin";
  const isDiretor = role === "diretor";
  const isAdminOrDiretor = isAdmin || isDiretor;

  return {
    role,
    isLoading: query.isLoading,
    canAccess,
    isAdmin,
    isDiretor,
    isAdminOrDiretor,
    ROUTE_ACCESS,
  };
}
