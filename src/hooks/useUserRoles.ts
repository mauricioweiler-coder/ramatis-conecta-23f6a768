import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  role: string | null;
  user_role: string | null;
  user_role_id: string | null;
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("*");
      if (rErr) throw rErr;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r]) || []);

      return (profiles || []).map((p): UserWithRole => {
        const ur = roleMap.get(p.id);
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          created_at: p.created_at,
          role: p.role,
          user_role: ur?.role || null,
          user_role_id: ur?.id || null,
        };
      });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, existingRoleId }: { userId: string; role: string; existingRoleId: string | null }) => {
      if (existingRoleId) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: role as any })
          .eq("id", existingRoleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: role as any });
        if (error) throw error;
      }
      // Also update profile role
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ role: role.toUpperCase() })
        .eq("id", userId);
      if (pErr) throw pErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    },
  });
}
