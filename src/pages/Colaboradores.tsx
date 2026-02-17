import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, UserCheck, UserX, Loader2 } from "lucide-react";
import { useWorkersList } from "@/hooks/useWorkers";
import WorkerFormDialog from "@/components/WorkerFormDialog";

const statusColor: Record<string, string> = {
  ATIVO: "bg-primary/10 text-primary border-primary/20",
  INATIVO: "bg-muted text-muted-foreground border-border",
};

const bondLabels: Record<string, string> = {
  VOLUNTARIO: "Voluntário",
  CONTRATADO: "Contratado",
};

export default function Colaboradores() {
  const { data: workers, isLoading } = useWorkersList();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = (workers || []).filter((w) => {
    const matchSearch =
      w.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (w.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || w.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAtivos = (workers || []).filter((w) => w.status === "ATIVO").length;
  const totalInativos = (workers || []).filter((w) => w.status === "INATIVO").length;

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
          <p className="text-muted-foreground">Gerencie os colaboradores da casa</p>
        </div>
        <WorkerFormDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{(workers || []).length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <UserCheck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalAtivos}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <UserX className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalInativos}</p>
              <p className="text-xs text-muted-foreground">Inativos</p>
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
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
                <TableHead>Vínculo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((w) => (
                <TableRow key={w.id} className="cursor-pointer">
                  <TableCell className="font-medium text-foreground">{w.full_name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{w.email || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{w.mobile_phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{bondLabels[w.bond_type || ""] || w.bond_type || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[w.status || ""] || ""}>{w.status || "—"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum colaborador encontrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
