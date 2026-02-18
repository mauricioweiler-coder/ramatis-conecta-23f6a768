import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Eye, Pencil } from "lucide-react";
import { useUsersWithRoles } from "@/hooks/useUserRoles";
import { useAllPermissions, useUpsertPermission, ALL_MODULES, MODULE_LABELS, type ModuleName } from "@/hooks/useUserPermissions";
import { useToast } from "@/hooks/use-toast";

export default function UserPermissionsTab() {
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading: usersLoading } = useUsersWithRoles();
  const { data: allPerms = [], isLoading: permsLoading } = useAllPermissions();
  const upsert = useUpsertPermission();
  const { toast } = useToast();

  // Exclude admin/diretor from permission management (they always have full access)
  const managedUsers = users.filter(
    (u) => u.user_role !== "admin" && u.user_role !== "diretor"
  );

  const filtered = managedUsers.filter((u) =>
    (u.full_name || u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // Build permission lookup: user_id -> module -> { can_view, can_edit }
  const permMap = useMemo(() => {
    const map: Record<string, Record<string, { can_view: boolean; can_edit: boolean }>> = {};
    for (const p of allPerms) {
      if (!map[p.user_id]) map[p.user_id] = {};
      map[p.user_id][p.module] = { can_view: p.can_view, can_edit: p.can_edit };
    }
    return map;
  }, [allPerms]);

  const handleToggle = (userId: string, module: ModuleName, field: "can_view" | "can_edit") => {
    const current = permMap[userId]?.[module] || { can_view: false, can_edit: false };
    const newValue = !current[field];
    
    // If enabling edit, also enable view
    const newView = field === "can_edit" && newValue ? true : (field === "can_view" ? newValue : current.can_view);
    // If disabling view, also disable edit
    const newEdit = field === "can_view" && !newValue ? false : (field === "can_edit" ? newValue : current.can_edit);

    upsert.mutate(
      { user_id: userId, module, can_view: newView, can_edit: newEdit },
      {
        onError: () => toast({ title: "Erro ao salvar permissão", variant: "destructive" }),
      }
    );
  };

  if (usersLoading || permsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permissões por Usuário</CardTitle>
          <p className="text-sm text-muted-foreground">
            Admin e Diretor possuem acesso total automaticamente. Configure as permissões dos demais usuários abaixo.
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar usuário..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Usuário</TableHead>
                <TableHead className="min-w-[100px]">Role</TableHead>
                {ALL_MODULES.map((m) => (
                  <TableHead key={m} className="text-center min-w-[120px]">
                    {MODULE_LABELS[m]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2 + ALL_MODULES.length} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">
                      {u.full_name || "Sem nome"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.user_role || "—"}</Badge>
                    </TableCell>
                    {ALL_MODULES.map((module) => {
                      const perm = permMap[u.id]?.[module] || { can_view: false, can_edit: false };
                      return (
                        <TableCell key={module} className="text-center">
                          <div className="flex items-center justify-center gap-3">
                            <label className="flex items-center gap-1 cursor-pointer text-xs text-muted-foreground">
                              <Checkbox
                                checked={perm.can_view}
                                onCheckedChange={() => handleToggle(u.id, module, "can_view")}
                              />
                              <Eye className="h-3.5 w-3.5" />
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer text-xs text-muted-foreground">
                              <Checkbox
                                checked={perm.can_edit}
                                onCheckedChange={() => handleToggle(u.id, module, "can_edit")}
                              />
                              <Pencil className="h-3.5 w-3.5" />
                            </label>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> = Visualizar</span>
            <span className="flex items-center gap-1"><Pencil className="h-3.5 w-3.5" /> = Editar</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
