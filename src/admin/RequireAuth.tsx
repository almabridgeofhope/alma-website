import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSession } from "./useSession";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Anmeldung wird geprüft</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
