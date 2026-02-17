import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScanFace, UserCheck, Clock, Calendar, Search } from "lucide-react";
import { useState } from "react";

interface RegistroPresenca {
  id: string;
  nome: string;
  horario: string;
  data: string;
  status: "Confirmado" | "Manual";
}

const mockPresenca: RegistroPresenca[] = [
  { id: "1", nome: "Maria Silva", horario: "18:32", data: "2026-02-17", status: "Confirmado" },
  { id: "2", nome: "João Santos", horario: "18:35", data: "2026-02-17", status: "Confirmado" },
  { id: "3", nome: "Ana Oliveira", horario: "18:40", data: "2026-02-17", status: "Confirmado" },
  { id: "4", nome: "Roberto Lima", horario: "18:42", data: "2026-02-17", status: "Manual" },
  { id: "5", nome: "Teresa Costa", horario: "18:50", data: "2026-02-17", status: "Confirmado" },
  { id: "6", nome: "Paulo Mendes", horario: "18:55", data: "2026-02-17", status: "Confirmado" },
  { id: "7", nome: "Clara Souza", horario: "19:01", data: "2026-02-17", status: "Manual" },
  { id: "8", nome: "Lucia Fernandes", horario: "19:05", data: "2026-02-17", status: "Confirmado" },
];

export default function Presenca() {
  const [search, setSearch] = useState("");
  const hoje = new Date().toLocaleDateString("pt-BR");

  const filtered = mockPresenca.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Registro de Presença</h1>
        <p className="text-muted-foreground">Controle de presença dos colaboradores</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <UserCheck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{mockPresenca.length}</p>
              <p className="text-xs text-muted-foreground">Presenças Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <ScanFace className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{mockPresenca.filter((p) => p.status === "Confirmado").length}</p>
              <p className="text-xs text-muted-foreground">Via Reconhecimento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{hoje}</p>
              <p className="text-xs text-muted-foreground">Data Atual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulated face recognition panel */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanFace className="h-5 w-5 text-primary" />
            Módulo de Reconhecimento Facial
          </CardTitle>
          <CardDescription>
            O módulo de reconhecimento facial opera em um tablet dedicado. Abaixo está o registro de presenças do dia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <ScanFace className="mr-2 h-4 w-4" />
            Modo tablet — Disponível apenas no dispositivo dedicado
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presenças de Hoje</CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar colaborador..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Método</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{p.horario}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.status === "Confirmado" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}>
                      {p.status === "Confirmado" ? "Facial" : "Manual"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
