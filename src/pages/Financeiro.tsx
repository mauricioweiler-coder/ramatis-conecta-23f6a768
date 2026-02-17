import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, Wallet, Search } from "lucide-react";

interface Transacao {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: "entrada" | "saida";
  data: string;
  formaPagamento: string;
}

const mockTransacoes: Transacao[] = [
  { id: "1", descricao: "Mensalidade — Maria Silva", categoria: "Mensalidade", valor: 50, tipo: "entrada", data: "2026-02-17", formaPagamento: "PIX" },
  { id: "2", descricao: "Conta de energia", categoria: "Utilidades", valor: 320, tipo: "saida", data: "2026-02-16", formaPagamento: "Boleto" },
  { id: "3", descricao: "Mensalidade — João Santos", categoria: "Mensalidade", valor: 50, tipo: "entrada", data: "2026-02-16", formaPagamento: "Dinheiro" },
  { id: "4", descricao: "Material didático", categoria: "Educação", valor: 180, tipo: "saida", data: "2026-02-15", formaPagamento: "Cartão" },
  { id: "5", descricao: "Doação anônima", categoria: "Doação", valor: 500, tipo: "entrada", data: "2026-02-15", formaPagamento: "PIX" },
  { id: "6", descricao: "Manutenção predial", categoria: "Manutenção", valor: 750, tipo: "saida", data: "2026-02-14", formaPagamento: "Transferência" },
];

export default function Financeiro() {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");

  const totalEntradas = mockTransacoes.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const totalSaidas = mockTransacoes.filter((t) => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const filtered = mockTransacoes.filter((t) => {
    const matchSearch = t.descricao.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "all" || t.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Financeiro</h1>
          <p className="text-muted-foreground">Controle de caixa e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
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
                  <Label>Descrição</Label>
                  <Input placeholder="Descrição da movimentação" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Valor (R$)</Label>
                    <Input type="number" placeholder="0,00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select>
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
                    <Label>Forma de Pagamento</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cartão">Cartão</SelectItem>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">R$ {totalEntradas.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">Entradas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <TrendingDown className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">R$ {totalSaidas.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">Saídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">R$ {saldo.toLocaleString("pt-BR")}</p>
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
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
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
                <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground">{new Date(t.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium text-foreground">{t.descricao}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{t.categoria}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{t.formaPagamento}</TableCell>
                  <TableCell className={`text-right font-semibold ${t.tipo === "entrada" ? "text-primary" : "text-destructive"}`}>
                    {t.tipo === "entrada" ? "+" : "-"} R$ {t.valor.toLocaleString("pt-BR")}
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
