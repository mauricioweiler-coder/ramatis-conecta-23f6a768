import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Printer, Users, CheckCircle, Clock, AlertCircle,
  CalendarCheck, BarChart3, Filter, X, Loader2
} from "lucide-react";
import { useAssistanceRecords } from "@/hooks/useAssistanceRecords";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useWorkersList } from "@/hooks/useWorkers";

const statusMap: Record<string, string> = {
  AGENDADO: "Agendado",
  AGUARDANDO: "Presente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

const statusColor: Record<string, string> = {
  Agendado: "bg-accent/10 text-accent-foreground border-border",
  Presente: "bg-destructive/10 text-destructive border-destructive/20",
  "Em andamento": "bg-primary/10 text-primary border-primary/20",
  Concluído: "bg-muted text-muted-foreground border-border",
};

export default function DashboardAtendimentos() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [workerId, setWorkerId] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: records = [], isLoading } = useAssistanceRecords();
  const { data: serviceTypes = [] } = useServiceTypes(true, "individual");
  const { data: workers = [] } = useWorkersList();

  const filtered = useMemo(() => {
    return records
      .map((r) => ({ ...r, displayStatus: statusMap[r.status || "AGENDADO"] || "Agendado" }))
      .filter((r) => {
        const recordDate = r.created_at.slice(0, 10);
        if (dateFrom && recordDate < dateFrom) return false;
        if (dateTo && recordDate > dateTo) return false;
        if (workerId !== "all" && r.interviewer_id !== workerId) return false;
        if (typeFilter !== "all" && r.referral !== typeFilter) return false;
        return true;
      });
  }, [records, dateFrom, dateTo, workerId, typeFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const agendados = filtered.filter((r) => r.status === "AGENDADO").length;
    const presentes = filtered.filter((r) => r.status === "AGUARDANDO").length;
    const emAndamento = filtered.filter((r) => r.status === "EM_ANDAMENTO").length;
    const concluidos = filtered.filter((r) => r.status === "CONCLUIDO").length;

    const byType: Record<string, number> = {};
    filtered.forEach((r) => {
      const key = r.referral || "Sem tipo";
      byType[key] = (byType[key] || 0) + 1;
    });

    const byWorker: Record<string, number> = {};
    filtered.forEach((r) => {
      const key = r.interviewer_name || "Não atribuído";
      byWorker[key] = (byWorker[key] || 0) + 1;
    });

    return { total, agendados, presentes, emAndamento, concluidos, byType, byWorker };
  }, [filtered]);

  const hasFilters = dateFrom || dateTo || workerId !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setWorkerId("all");
    setTypeFilter("all");
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const filterDesc: string[] = [];
    if (dateFrom) filterDesc.push(`De: ${new Date(dateFrom + "T12:00:00").toLocaleDateString("pt-BR")}`);
    if (dateTo) filterDesc.push(`Até: ${new Date(dateTo + "T12:00:00").toLocaleDateString("pt-BR")}`);
    if (workerId !== "all") {
      const w = workers.find((w) => w.id === workerId);
      filterDesc.push(`Trabalhador: ${w?.full_name || workerId}`);
    }
    if (typeFilter !== "all") filterDesc.push(`Tipo: ${typeFilter}`);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Atendimentos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 16px; }
          .filters { font-size: 11px; color: #888; margin-bottom: 16px; padding: 8px; background: #f5f5f5; border-radius: 4px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #ddd; border-radius: 6px; padding: 12px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; }
          .stat-label { font-size: 11px; color: #666; }
          .section-title { font-size: 14px; font-weight: bold; margin: 16px 0 8px; }
          .breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .breakdown-list { font-size: 12px; }
          .breakdown-list li { padding: 3px 0; list-style: none; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
          .footer { margin-top: 24px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 8px; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <h1>Relatório de Atendimentos Individuais</h1>
        <p class="subtitle">Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
        ${filterDesc.length > 0 ? `<div class="filters"><strong>Filtros:</strong> ${filterDesc.join(" | ")}</div>` : ""}

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-value">${stats.total}</div><div class="stat-label">Total</div></div>
          <div class="stat-card"><div class="stat-value">${stats.agendados}</div><div class="stat-label">Agendados</div></div>
          <div class="stat-card"><div class="stat-value">${stats.emAndamento + stats.presentes}</div><div class="stat-label">Em atendimento</div></div>
          <div class="stat-card"><div class="stat-value">${stats.concluidos}</div><div class="stat-label">Concluídos</div></div>
        </div>

        <div class="breakdown">
          <div>
            <p class="section-title">Por Tipo de Atendimento</p>
            <ul class="breakdown-list">
              ${Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join("")}
            </ul>
          </div>
          <div>
            <p class="section-title">Por Trabalhador</p>
            <ul class="breakdown-list">
              ${Object.entries(stats.byWorker).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join("")}
            </ul>
          </div>
        </div>

        <p class="section-title">Detalhamento (${filtered.length} registros)</p>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Data</th>
              <th>Entrevistador</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((r) => `
              <tr>
                <td>${r.visitor_name}</td>
                <td>${r.referral || "—"}</td>
                <td>${new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                <td>${r.interviewer_name || "—"}</td>
                <td>${statusMap[r.status || "AGENDADO"]}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer">Sistema de Gestão — Relatório gerado automaticamente</div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={printRef}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/atendimentos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl flex items-center gap-2">
              <BarChart3 className="h-7 w-7" />
              Dashboard de Atendimentos
            </h1>
            <p className="text-muted-foreground">Visão analítica dos atendimentos individuais</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir Relatório
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="grid gap-1.5">
              <Label className="text-xs">Data Início</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Data Fim</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Trabalhador</Label>
              <Select value={workerId} onValueChange={setWorkerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Tipo de Atendimento</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {serviceTypes.map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              {hasFilters && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CalendarCheck className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.agendados}</p>
              <p className="text-xs text-muted-foreground">Agendados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.presentes}</p>
              <p className="text-xs text-muted-foreground">Presentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.emAndamento}</p>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.concluidos}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Por Tipo de Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.byType).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-primary/20 w-24">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                        <Badge variant="secondary" className="text-xs min-w-[2rem] justify-center">{count}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Por Trabalhador</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.byWorker).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.byWorker)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{name}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-primary/20 w-24">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                        <Badge variant="secondary" className="text-xs min-w-[2rem] justify-center">{count}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalhamento ({filtered.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="hidden md:table-cell">Entrevistador</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado com os filtros selecionados
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{r.visitor_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{r.symptom}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline">{r.referral || "—"}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{r.interviewer_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[r.displayStatus]}>
                        {r.displayStatus}
                      </Badge>
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
