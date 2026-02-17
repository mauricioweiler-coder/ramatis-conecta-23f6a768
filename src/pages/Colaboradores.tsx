import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, UserCheck, UserX } from "lucide-react";

interface Colaborador {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: "Ativo" | "Inativo" | "Administrador";
  dataIngresso: string;
  mensalidade: "Em dia" | "Atrasado" | "Inadimplente";
}

const mockColaboradores: Colaborador[] = [
  { id: "1", nome: "Maria Silva", email: "maria@email.com", telefone: "(11) 99999-0001", status: "Ativo", dataIngresso: "2023-01-15", mensalidade: "Em dia" },
  { id: "2", nome: "João Santos", email: "joao@email.com", telefone: "(11) 99999-0002", status: "Ativo", dataIngresso: "2022-06-10", mensalidade: "Atrasado" },
  { id: "3", nome: "Ana Oliveira", email: "ana@email.com", telefone: "(11) 99999-0003", status: "Administrador", dataIngresso: "2020-03-01", mensalidade: "Em dia" },
  { id: "4", nome: "Carlos Pereira", email: "carlos@email.com", telefone: "(11) 99999-0004", status: "Inativo", dataIngresso: "2021-09-20", mensalidade: "Inadimplente" },
  { id: "5", nome: "Lucia Fernandes", email: "lucia@email.com", telefone: "(11) 99999-0005", status: "Ativo", dataIngresso: "2024-02-14", mensalidade: "Em dia" },
];

const statusColor: Record<string, string> = {
  Ativo: "bg-primary/10 text-primary border-primary/20",
  Inativo: "bg-muted text-muted-foreground border-border",
  Administrador: "bg-secondary text-secondary-foreground border-secondary/50",
};

const mensalidadeColor: Record<string, string> = {
  "Em dia": "bg-primary/10 text-primary border-primary/20",
  Atrasado: "bg-destructive/10 text-destructive border-destructive/20",
  Inadimplente: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Colaboradores() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = mockColaboradores.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAtivos = mockColaboradores.filter((c) => c.status === "Ativo").length;
  const totalInativos = mockColaboradores.filter((c) => c.status === "Inativo").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie os colaboradores da casa</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Colaborador</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Colaborador</DialogTitle>
              <DialogDescription>Preencha os dados do novo colaborador</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" placeholder="Nome do colaborador" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{mockColaboradores.length}</p>
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
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Administrador">Administrador</SelectItem>
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
                <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mensalidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{c.telefone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[c.status]}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={mensalidadeColor[c.mensalidade]}>{c.mensalidade}</Badge>
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
