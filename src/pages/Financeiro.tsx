import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, Wallet, Search, Loader2 } from "lucide-react";
import { useTransactions, useCreateTransaction } from "@/hooks/useTransactions";
import { useWorkers } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";

export default function Financeiro() {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ description: "", type: "", amount: "", category: "", responsible_id: "" });

  const { data: transactions = [], isLoading } = useTransactions();
  const createTransaction = useCreateTransaction();
  const { data: workers = [] } = useWorkers();
  const { toast } = useToast();

  const totalEntradas = transactions.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
  const totalSaidas = transactions.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);
  const saldo = totalEntradas - totalSaidas;

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "all" || t.type === filterTipo;
    return matchSearch && matchTipo;
  });

  const handleSubmit = () => {
    if (!form.description || !form.type || !form.amount || !form.category) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    createTransaction.mutate(
      {
        description: form.description,
        type: form.type,
        amount: parseFloat(form.amount),
        category: form.category,
        responsible_id: form.responsible_id || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Movimentação registrada!" });
          setForm({ description: "", type: "", amount: "", category: "", responsible_id: "" });
          setDialogOpen(false);
        },
        onError: () => toast({ title: "Erro ao registrar", variant: "destructive" }),
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Financeiro</h1>
          <p className="text-muted-foreground">Controle de caixa e movimentações</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Movimentação</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Movimentação</DialogTitle>
              <DialogDescription>Preencha os dados da movimentação financeira</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Descrição *</Label>
                <Input placeholder="Descrição da movimentação" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoria *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                      <SelectItem value="Doação">Doação</SelectItem>
                      <SelectItem value="Utilidades">Utilidades</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                      <SelectItem value="Educação">Educação</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Responsável</Label>
                  <Select value={form.responsible_id} onValueChange={(v) => setForm({ ...form, responsible_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                    <SelectContent>
                      {workers.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={createTransaction.isPending}>
                {createTransaction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">R$ {totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Entradas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <TrendingDown className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">R$ {totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Saídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Saldo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar movimentação..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma movimentação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">{new Date(t.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium text-foreground">{t.description}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{t.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{t.responsible_worker?.full_name || t.responsible_name || "—"}</TableCell>
                    <TableCell className={`text-right font-semibold ${t.type === "entrada" ? "text-primary" : "text-destructive"}`}>
                      {t.type === "entrada" ? "+" : "-"} R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
