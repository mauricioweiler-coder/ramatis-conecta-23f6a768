import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, ToggleLeft, ToggleRight, Pencil, Trash2 } from "lucide-react";
import { useServiceTypes, useCreateServiceType, useUpdateServiceType, useToggleServiceType, useDeleteServiceType, ServiceType } from "@/hooks/useServiceTypes";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useToast } from "@/hooks/use-toast";

export default function ServiceTypesTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<string>("coletivo");
  const [level, setLevel] = useState<number>(1);

  const { data: types = [], isLoading } = useServiceTypes();
  const create = useCreateServiceType();
  const update = useUpdateServiceType();
  const toggle = useToggleServiceType();
  const deleteType = useDeleteServiceType();
  const { isAdminOrDiretor } = useCurrentUserRole();
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setDescription("");
    setMode("coletivo");
    setLevel(1);
    setEditingType(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (t: ServiceType) => {
    setEditingType(t);
    setName(t.name);
    setDescription(t.description || "");
    setMode(t.mode);
    setLevel(t.level);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Informe o nome do atendimento", variant: "destructive" });
      return;
    }

    const payload = { name: name.trim(), description: description.trim() || undefined, mode, level };

    if (editingType) {
      update.mutate(
        { id: editingType.id, ...payload },
        {
          onSuccess: () => {
            toast({ title: "Tipo atualizado!" });
            resetForm();
            setDialogOpen(false);
          },
          onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
        }
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Tipo cadastrado!" });
          resetForm();
          setDialogOpen(false);
        },
        onError: () => toast({ title: "Erro ao cadastrar", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteType.mutate(id, {
      onSuccess: () => toast({ title: "Tipo excluído!" }),
      onError: () => toast({ title: "Erro ao excluir. Pode estar em uso.", variant: "destructive" }),
    });
  };

  const isPending = create.isPending || update.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tipos de Atendimento</h2>
          <p className="text-sm text-muted-foreground">Cadastre os tipos de atendimento disponíveis</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Novo Tipo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingType ? "Editar Tipo de Atendimento" : "Novo Tipo de Atendimento"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input placeholder="Ex: Passe de Corrente" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Input placeholder="Descrição opcional" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Nível *</Label>
                <Select value={String(level)} onValueChange={(v) => setLevel(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>Nível {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Modalidade *</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coletivo">Coletivo</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingType ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum tipo cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                types.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-foreground">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Nível {t.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t.mode === "individual" ? "Individual" : "Coletivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{t.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.active ? "default" : "secondary"}>
                        {t.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggle.mutate({ id: t.id, active: !t.active })}
                          title={t.active ? "Desativar" : "Ativar"}
                        >
                          {t.active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdminOrDiretor && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir tipo de atendimento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir "{t.name}"? Esta ação não pode ser desfeita. Se o tipo estiver em uso, a exclusão será bloqueada.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(t.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
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
