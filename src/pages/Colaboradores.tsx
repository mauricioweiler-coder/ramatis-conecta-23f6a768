import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Users, UserCheck, GraduationCap, Loader2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const INACTIVE_DAYS = 90;

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

function useLastAttendance() {
  return useQuery({
    queryKey: ["last-attendance-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("member_id, date")
        .order("date", { ascending: false });
      if (error) throw error;
      // Build map: member_id -> latest date
      const map: Record<string, string> = {};
      for (const row of data || []) {
        if (row.member_id && !map[row.member_id]) {
          map[row.member_id] = row.date;
        }
      }
      return map;
    },
  });
}

function useWorkersStatus() {
  return useQuery({
    queryKey: ["workers-status-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workers")
        .select("id, status");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const w of data || []) {
        map[w.id] = w.status || "ATIVO";
      }
      return map;
    },
  });
}

function useToggleWorkerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workerId, newStatus }: { workerId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("workers")
        .update({ status: newStatus })
        .eq("id", workerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers-status-map"] });
      queryClient.invalidateQueries({ queryKey: ["workers-list"] });
    },
  });
}

export default function Colaboradores() {
  const { data: profiles, isLoading: profilesLoading } = useProfilesList();
  const { data: lastAttendanceMap = {}, isLoading: attendanceLoading } = useLastAttendance();
  const { data: workersStatusMap = {}, isLoading: workersLoading } = useWorkersStatus();
  const { isAdminOrDiretor } = useCurrentUserRole();
  const toggleStatus = useToggleWorkerStatus();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterInactive, setFilterInactive] = useState<string>("all");

  const isLoading = profilesLoading || attendanceLoading || workersLoading;

  const colaboradores = (profiles || []).filter((p) => p.role !== "ALUNO");
  const alunos = (profiles || []).filter((p) => p.role === "ALUNO");

  const now = new Date();

  const enriched = useMemo(() => {
    return colaboradores.map((p) => {
      const lastDate = lastAttendanceMap[p.id];
      const daysSinceAttendance = lastDate
        ? Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const isInactive90 = daysSinceAttendance === null || daysSinceAttendance >= INACTIVE_DAYS;
      const workerStatus = workersStatusMap[p.id] || null;
      return { ...p, lastDate, daysSinceAttendance, isInactive90, workerStatus };
    });
  }, [colaboradores, lastAttendanceMap, workersStatusMap]);

  const filtered = enriched.filter((p) => {
    const matchSearch =
      (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || p.role === filterRole;
    const matchInactive =
      filterInactive === "all" ||
      (filterInactive === "inactive" && p.isInactive90) ||
      (filterInactive === "active" && !p.isInactive90);
    return matchSearch && matchRole && matchInactive;
  });

  // Sort: inactive 90+ days first
  const sorted = [...filtered].sort((a, b) => {
    if (a.isInactive90 && !b.isInactive90) return -1;
    if (!a.isInactive90 && b.isInactive90) return 1;
    // Within same group, sort by days since attendance desc (most inactive first)
    const aDays = a.daysSinceAttendance ?? 9999;
    const bDays = b.daysSinceAttendance ?? 9999;
    return bDays - aDays;
  });

  const uniqueRoles = [...new Set(colaboradores.map((p) => p.role).filter(Boolean))];
  const inactiveCount = enriched.filter((p) => p.isInactive90).length;

  const handleToggleStatus = (profileId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === "ATIVO" ? "INATIVO" : "ATIVO";
    toggleStatus.mutate(
      { workerId: profileId, newStatus },
      {
        onSuccess: () => toast({ title: `Status alterado para ${newStatus}` }),
        onError: (err) => toast({ title: "Erro ao alterar status", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

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

      <div className="grid gap-4 sm:grid-cols-4">
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
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{inactiveCount}</p>
              <p className="text-xs text-muted-foreground">Inativos (90+ dias)</p>
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
                <SelectItem value="all">Todos os papéis</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role!}>
                    {roleLabels[role!] || role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterInactive} onValueChange={setFilterInactive}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar presença" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="inactive">Inativos (90+ dias)</SelectItem>
                <SelectItem value="active">Ativos (presença recente)</SelectItem>
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
                <TableHead>Papel</TableHead>
                <TableHead>Última Presença</TableHead>
                {isAdminOrDiretor && <TableHead>Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => (
                <TableRow key={p.id} className={p.isInactive90 ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {p.full_name || "—"}
                      {p.isInactive90 && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{p.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColor[p.role || ""] || ""}>
                      {roleLabels[p.role || ""] || p.role || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.lastDate ? (
                      <span className={p.isInactive90 ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {formatDistanceToNow(new Date(p.lastDate), { addSuffix: true, locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-destructive font-medium">Nunca registrou</span>
                    )}
                  </TableCell>
                  {isAdminOrDiretor && (
                    <TableCell>
                      {p.workerStatus !== null ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={p.workerStatus === "ATIVO"}
                            onCheckedChange={() => handleToggleStatus(p.id, p.workerStatus)}
                            disabled={toggleStatus.isPending}
                          />
                          <span className={`text-xs font-medium ${p.workerStatus === "ATIVO" ? "text-primary" : "text-destructive"}`}>
                            {p.workerStatus === "ATIVO" ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdminOrDiretor ? 5 : 4} className="text-center text-muted-foreground py-8">
                    Nenhum colaborador encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
