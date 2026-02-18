import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, UserCheck, GraduationCap, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  DIRETOR: "Diretor",
  PROFESSOR: "Professor",
  TRABALHADOR: "Trabalhador",
  ESTAGIARIO: "Estagiário",
  ALUNO: "Aluno",
};

const roleColor: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/20",
  DIRETOR: "bg-primary/10 text-primary border-primary/20",
  PROFESSOR: "bg-accent/50 text-accent-foreground border-accent",
  TRABALHADOR: "bg-secondary text-secondary-foreground border-border",
  ESTAGIARIO: "bg-muted text-muted-foreground border-border",
  ALUNO: "bg-muted text-muted-foreground border-border",
};

function useProfilesList() {
  return useQuery({
    queryKey: ["profiles-colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, mobile_phone, role, profile_completed, profile_photo_url")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

export default function Colaboradores() {
  const { data: profiles, isLoading } = useProfilesList();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  // Separate colaboradores (non-ALUNO) and alunos
  const colaboradores = (profiles || []).filter((p) => p.role !== "ALUNO");
  const alunos = (profiles || []).filter((p) => p.role === "ALUNO");

  const filtered = colaboradores.filter((p) => {
    const matchSearch =
      (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || p.role === filterRole;
    return matchSearch && matchRole;
  });

  const uniqueRoles = [...new Set(colaboradores.map((p) => p.role).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Colaboradores</h1>
          <p className="text-muted-foreground">Membros registrados na casa</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{(profiles || []).length}</p>
              <p className="text-xs text-muted-foreground">Total Cadastrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <UserCheck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{colaboradores.length}</p>
              <p className="text-xs text-muted-foreground">Colaboradores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{alunos.length}</p>
              <p className="text-xs text-muted-foreground">Alunos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou e-mail..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filtrar papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role!}>
                    {roleLabels[role!] || role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead className="hidden lg:table-cell">Celular</TableHead>
                <TableHead>Papel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.full_name || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{p.email || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{p.mobile_phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColor[p.role || ""] || ""}>
                      {roleLabels[p.role || ""] || p.role || "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum colaborador encontrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alunos section */}
      {alunos.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Alunos
            </h2>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden lg:table-cell">Celular</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-foreground">{p.full_name || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{p.email || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{p.mobile_phone || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
