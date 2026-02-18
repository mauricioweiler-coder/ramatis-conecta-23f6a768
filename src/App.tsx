import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Colaboradores from "./pages/Colaboradores";
import Financeiro from "./pages/Financeiro";
import Cursos from "./pages/Cursos";
import Atendimento from "./pages/Atendimento";
import Atendimentos from "./pages/Atendimentos";
import RealizarAtendimento from "./pages/RealizarAtendimento";
import Presenca from "./pages/Presenca";
import GestaoRoles from "./pages/GestaoRoles";
import MeuPerfil from "./pages/MeuPerfil";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/colaboradores" element={<Colaboradores />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/atendimento" element={<Atendimento />} />
              <Route path="/atendimentos" element={<Atendimentos />} />
              <Route path="/atendimentos/:id" element={<RealizarAtendimento />} />
              <Route path="/presenca" element={<Presenca />} />
              <Route path="/gestao-roles" element={<GestaoRoles />} />
              <Route path="/meu-perfil" element={<MeuPerfil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
