import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, GraduationCap, Heart, TrendingUp, TrendingDown, UserCheck, AlertCircle } from "lucide-react";

const stats = [
  { label: "Colaboradores Ativos", value: "127", icon: Users, change: "+3 este mês" },
  { label: "Presença Hoje", value: "42", icon: UserCheck, change: "33% do total" },
  { label: "Receitas (Mês)", value: "R$ 8.450", icon: TrendingUp, change: "+12% vs anterior" },
  { label: "Despesas (Mês)", value: "R$ 5.230", icon: TrendingDown, change: "-8% vs anterior" },
  { label: "Cursos Ativos", value: "6", icon: GraduationCap, change: "84 alunos" },
  { label: "Atendimentos Pendentes", value: "14", icon: Heart, change: "5 novos hoje" },
];

const recentActivity = [
  { text: "Maria Silva registrou presença", time: "Há 5 min" },
  { text: "Pagamento de mensalidade — João Santos", time: "Há 15 min" },
  { text: "Nova solicitação de atendimento espiritual", time: "Há 30 min" },
  { text: "Curso Evangelho no Lar — Presença registrada", time: "Há 1h" },
  { text: "Fechamento de caixa confirmado", time: "Há 2h" },
];

const alerts = [
  { text: "12 mensalidades atrasadas", type: "warning" },
  { text: "3 solicitações de atendimento aguardando há +5 dias", type: "warning" },
];

export default function Dashboard() {
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
                  <p key={i} className="text-sm text-foreground">{alert.text}</p>
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
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{item.time}</span>
                </div>
              ))}
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
                <span className="text-sm font-semibold text-foreground">R$ 8.450,00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Despesas</span>
                <span className="text-sm font-semibold text-foreground">R$ 5.230,00</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Saldo</span>
                  <span className="text-lg font-bold text-primary">R$ 3.220,00</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mensalidades recebidas</span>
                  <span>85/127</span>
                </div>
                <div className="h-2 rounded-full bg-accent">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "67%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
