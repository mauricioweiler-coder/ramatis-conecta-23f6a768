import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setCheckingProfile(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", session.user.id)
        .single();
      setProfileCompleted((data as any)?.profile_completed ?? false);
      setCheckingProfile(false);
    };
    check();
  }, [session]);

  if (loading || checkingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to profile completion, but not if already on that page
  if (profileCompleted === false && location.pathname !== "/meu-perfil") {
    return <Navigate to="/meu-perfil" state={{ firstLogin: true }} replace />;
  }

  return <>{children}</>;
}
