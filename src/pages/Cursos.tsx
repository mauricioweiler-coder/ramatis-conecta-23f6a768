import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GraduationCap, Users, Calendar, BookOpen } from "lucide-react";

interface Curso {
  id: string;
  nome: string;
  descricao: string;
  coordenador: string;
  professor: string;
  alunos: number;
  frequencia: string;
  status: "Ativo" | "Encerrado" | "Planejado";
  proximoEncontro: string;
}

const mockCursos: Curso[] = [
  { id: "1", nome: "Evangelho no Lar", descricao: "Estudo aprofundado do evangelho segundo o espiritismo", coordenador: "Ana Oliveira", professor: "Roberto Lima", alunos: 22, frequencia: "Semanal", status: "Ativo", proximoEncontro: "2026-02-19" },
  { id: "2", nome: "Passe e Energias", descricao: "Curso sobre passes magnéticos e manipulação de energias", coordenador: "Maria Silva", professor: "Teresa Costa", alunos: 15, frequencia: "Quinzenal", status: "Ativo", proximoEncontro: "2026-02-22" },
  { id: "3", nome: "Mediunidade — Básico", descricao: "Introdução ao estudo da mediunidade", coordenador: "João Santos", professor: "Paulo Mendes", alunos: 18, frequencia: "Semanal", status: "Ativo", proximoEncontro: "2026-02-20" },
  { id: "4", nome: "Reforma Íntima", descricao: "Estudo voltado ao autoconhecimento e transformação moral", coordenador: "Ana Oliveira", professor: "Clara Souza", alunos: 12, frequencia: "Semanal", status: "Ativo", proximoEncontro: "2026-02-21" },
  { id: "5", nome: "Educação Espírita Infantil", descricao: "Aulas para crianças com base na doutrina espírita", coordenador: "Lucia Fernandes", professor: "Marta Alves", alunos: 17, frequencia: "Semanal", status: "Ativo", proximoEncontro: "2026-02-18" },
  { id: "6", nome: "Apometria — Avançado", descricao: "Estudo avançado de técnicas apométricas", coordenador: "Roberto Lima", professor: "Eduardo Gomes", alunos: 0, frequencia: "Mensal", status: "Planejado", proximoEncontro: "2026-03-01" },
];

const statusVariant: Record<string, string> = {
  Ativo: "bg-primary/10 text-primary border-primary/20",
  Encerrado: "bg-muted text-muted-foreground border-border",
  Planejado: "bg-secondary/10 text-secondary border-secondary/20",
};

export default function Cursos() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Cursos</h1>
          <p className="text-muted-foreground">Gestão de cursos e turmas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Curso</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Curso</DialogTitle>
              <DialogDescription>Preencha as informações do novo curso</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Curso</Label>
                <Input placeholder="Nome do curso" />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descreva o curso..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Coordenador</Label>
                  <Input placeholder="Nome" />
                </div>
                <div className="grid gap-2">
                  <Label>Professor</Label>
                  <Input placeholder="Nome" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Frequência</Label>
                <Input placeholder="Ex: Semanal, Quinzenal" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Criar Curso</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{mockCursos.length}</p>
              <p className="text-xs text-muted-foreground">Total de Cursos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{mockCursos.reduce((s, c) => s + c.alunos, 0)}</p>
              <p className="text-xs text-muted-foreground">Total de Alunos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{mockCursos.filter((c) => c.status === "Ativo").length}</p>
              <p className="text-xs text-muted-foreground">Cursos Ativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockCursos.map((curso) => (
          <Card key={curso.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{curso.nome}</CardTitle>
                <Badge variant="outline" className={statusVariant[curso.status]}>{curso.status}</Badge>
              </div>
              <CardDescription className="line-clamp-2">{curso.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{curso.alunos} alunos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{curso.professor}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{curso.frequencia} — Próximo: {new Date(curso.proximoEncontro).toLocaleDateString("pt-BR")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
