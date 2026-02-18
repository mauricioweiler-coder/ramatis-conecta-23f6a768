import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyPermissions, routeToModule } from "@/hooks/useUserPermissions";

export type AppRole = "admin" | "diretor" | "trabalhador" | "professor" | "estagiario" | "aluno";

// Routes that are always accessible (no permission needed)
const ALWAYS_ACCESSIBLE = ["/", "/meu-perfil"];
// Routes restricted to admin/diretor only (no permission override)
const ADMIN_ONLY_ROUTES = ["/gestao-roles"];

export function useCurrentUserRole() {
  const { user } = useAuth();
  const { data: permissions = [], isLoading: permissionsLoading } = useMyPermissions();

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
  const isAdmin = role === "admin";
  const isDiretor = role === "diretor";
  const isAdminOrDiretor = isAdmin || isDiretor;

  // Aluno only has access to cursos (view only)
  const isAluno = role === "aluno";

  const canAccess = (route: string): boolean => {
    // Always accessible routes
    if (ALWAYS_ACCESSIBLE.includes(route)) return true;
    // Admin-only routes
    if (ADMIN_ONLY_ROUTES.includes(route)) return isAdminOrDiretor;
    // Admin/Diretor always have full access
    if (isAdminOrDiretor) return true;
    // Aluno: only cursos module
    if (isAluno) {
      const module = routeToModule(route);
      return module === "cursos";
    }
    // Check permissions for the module
    const module = routeToModule(route);
    if (!module) return true;
    const perm = permissions.find((p) => p.module === module);
    return perm?.can_view === true;
  };

  const canEdit = (route: string): boolean => {
    if (isAdminOrDiretor) return true;
    // Aluno never edits
    if (isAluno) return false;
    const module = routeToModule(route);
    if (!module) return false;
    const perm = permissions.find((p) => p.module === module);
    return perm?.can_edit === true;
  };

  return {
    role,
    isLoading: query.isLoading || permissionsLoading,
    canAccess,
    canEdit,
    isAdmin,
    isDiretor,
    isAdminOrDiretor,
    permissions,
  };
}
