import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useSession } from "@/admin/useSession";
import { useNoIndex } from "@/admin/useNoIndex";

const AdminLogin = () => {
  useNoIndex("Anmelden · Projektabrechnung");
  const { session, isLoading } = useSession();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && session) {
    const target = (location.state as { from?: string } | null)?.from ?? "/admin/transfers";
    return <Navigate to={target} replace />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (signInError) {
      setError("Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm shadow-card">
        <CardHeader>
          <CardTitle className="text-primary">Projektabrechnung</CardTitle>
          <CardDescription>Interner Bereich von Alma Bridge of Hope.</CardDescription>
        </CardHeader>

        <CardContent>
          {!isSupabaseConfigured && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Nicht konfiguriert</AlertTitle>
              <AlertDescription>
                VITE_SUPABASE_URL und VITE_SUPABASE_PUBLISHABLE_KEY fehlen in dieser Umgebung.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !isSupabaseConfigured}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Anmelden
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
