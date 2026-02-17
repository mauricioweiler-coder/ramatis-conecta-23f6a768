import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shield, Loader2, Users } from "lucide-react";
import { useUsersWithRoles, useUpdateUserRole } from "@/hooks/useUserRoles";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "diretor", label: "Diretor" },
  { value: "professor", label: "Professor" },
  { value: "estagiario", label: "Estagiário" },
  { value: "trabalhador", label: "Trabalhador" },
  { value: "aluno", label: "Aluno" },
];

const roleBadgeColor: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  diretor: "bg-primary/10 text-primary border-primary/20",
  professor: "bg-primary/10 text-primary border-primary/20",
  estagiario: "bg-primary/10 text-primary border-primary/20",
  trabalhador: "bg-muted text-muted-foreground border-border",
  aluno: "bg-muted text-muted-foreground border-border",
};

export default function GestaoRoles() {
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useUsersWithRoles();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();

  const filtered = users.filter((u) =>
    (u.full_name || u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (userId: string, newRole: string, existingRoleId: string | null) => {
    updateRole.mutate(
      { userId, role: newRole, existingRoleId },
      {
        onSuccess: () => toast({ title: "Role atualizado com sucesso!" }),
        onError: (err) => toast({ title: "Erro ao atualizar role", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Gestão de Usuários</h1>
        <p className="text-muted-foreground">Gerencie os papéis e permissões dos usuários</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total de Usuários</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Shield className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{users.filter((u) => u.user_role === "admin").length}</p>
              <p className="text-xs text-muted-foreground">Administradores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{users.filter((u) => u.user_role === "professor").length}</p>
              <p className="text-xs text-muted-foreground">Professores</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar usuário..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role Atual</TableHead>
                <TableHead>Alterar Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">{u.full_name || "Sem nome"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{u.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleBadgeColor[u.user_role || "aluno"] || ""}>
                        {ROLES.find((r) => r.value === u.user_role)?.label || u.user_role || "Sem role"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.user_role || ""}
                        onValueChange={(v) => handleRoleChange(u.id, v, u.user_role_id)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
