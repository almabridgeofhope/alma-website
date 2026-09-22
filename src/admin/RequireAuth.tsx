import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useIsAppMember } from "./queries";
import { useSession } from "./useSession";

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">{children}</div>
);

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useSession();
  const location = useLocation();
  const membership = useIsAppMember(Boolean(session));

  if (isLoading || (session && membership.isPending)) {
    return (
      <Centered>
        <div role="status" aria-live="polite" className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm">Checking access …</span>
        </div>
      </Centered>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  // Ein Konto allein reicht nicht: der Zugriff haengt an der Freigabeliste app_members.
  if (membership.isSuccess && !membership.data) {
    return (
      <Centered>
        <Card className="w-full max-w-md shadow-card">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary-light">
              <ShieldAlert className="h-5 w-5 text-secondary-foreground" aria-hidden="true" />
            </div>
            <CardTitle>No access</CardTitle>
            <CardDescription>
              The account {session.user.email} is signed in but not cleared for project
              accounting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </Centered>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
