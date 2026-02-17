import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Heart, TrendingUp, TrendingDown, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: "Colaboradores Ativos", value: String(data.activeWorkers), icon: Users, change: `${data.totalWorkers} total` },
    { label: "Presença Hoje", value: String(data.todayAttendance), icon: UserCheck, change: "registros hoje" },
    { label: "Receitas (Mês)", value: `R$ ${data.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingUp, change: "mês atual" },
    { label: "Despesas (Mês)", value: `R$ ${data.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingDown, change: "mês atual" },
    { label: "Cursos Ativos", value: String(data.activeCourses), icon: GraduationCap, change: `${data.totalStudents} alunos` },
    { label: "Atendimentos Pendentes", value: String(data.pendingAssistance), icon: Heart, change: "aguardando" },
  ];

  const alerts: string[] = [];
  if (data.pendingAssistance > 0) alerts.push(`${data.pendingAssistance} atendimento(s) aguardando`);
  if (data.saldo < 0) alerts.push("Saldo financeiro negativo no mês");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da Associação Espírita Ramatís</p>
      </div>

      {alerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                {alerts.map((alert, i) => (
                  <p key={i} className="text-sm text-foreground">{alert}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas movimentações na casa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              ) : (
                data.recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatDistanceToNow(item.date, { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>Balanço do mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Receitas</span>
                <span className="text-sm font-semibold text-foreground">R$ {data.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Despesas</span>
                <span className="text-sm font-semibold text-foreground">R$ {data.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Saldo</span>
                  <span className={`text-lg font-bold ${data.saldo >= 0 ? "text-primary" : "text-destructive"}`}>
                    R$ {data.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
