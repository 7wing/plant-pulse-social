import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Loader2 } from "lucide-react";

interface ModeratorRouteProps {
  children: React.ReactNode;
}

export default function ModeratorRoute({ children }: ModeratorRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isModerator, loading: roleLoading } = useRole();
  const location = useLocation();

  const loading = authLoading || roleLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isModerator) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}