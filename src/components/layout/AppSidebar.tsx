import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  GraduationCap,
  Heart,
  HeartHandshake,
  ScanFace,
  Menu,
  X,
  LogOut,
  Shield,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/colaboradores", label: "Colaboradores", icon: Users },
  { to: "/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/atendimento", label: "Palestras", icon: Heart },
  { to: "/atendimentos", label: "Atendimentos", icon: HeartHandshake },
  { to: "/presenca", label: "Presença", icon: ScanFace },
  { to: "/gestao-roles", label: "Gestão de Roles", icon: Shield },
];

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { canAccess } = useCurrentUserRole();

  const filteredNavItems = navItems.filter((item) => canAccess(item.to));
  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          R
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">Ramatis Conecta</h1>
          <p className="text-xs text-muted-foreground">Associação Espírita</p>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => isMobile && setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-4 space-y-2">
        <p className="text-xs text-muted-foreground truncate px-2">{user?.email}</p>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-sm"
          onClick={() => {
            navigate("/meu-perfil");
            if (isMobile) setOpen(false);
          }}
        >
          <UserCog className="h-4 w-4" />
          Meu Perfil
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-sm" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
        <p className="text-xs text-muted-foreground px-2">v1.0 — Ramatis Conecta</p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50 md:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-xl">
              {sidebarContent}
            </aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
      {sidebarContent}
    </aside>
  );
}
