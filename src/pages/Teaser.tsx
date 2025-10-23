import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lock, Eye, EyeOff } from "lucide-react";

const Teaser = () => {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const correctPassword = "alma2024"; // Ändern Sie dieses Passwort

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Falsches Passwort. Bitte versuchen Sie es erneut.");
    }
  };

  if (isAuthenticated) {
    // Hier können Sie die vollständige Website einbetten oder weiterleiten
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Willkommen zur vollständigen Website
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Die vollständige Website ist noch in Entwicklung. Hier ist ein Vorgeschmack:
              </p>
              <Button 
                onClick={() => window.location.href = '/#news'}
                className="bg-primary hover:bg-primary/90"
              >
                Zur News-Sektion
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
          
          <div className="relative z-10 text-center max-w-4xl px-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground">
              Alma Bridge of Hope
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Building bridges of hope across continents through sustainable community development
            </p>
            
            {/* Password Form */}
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Vollständige Website
                  </h2>
                  <p className="text-muted-foreground">
                    Geben Sie das Passwort ein, um die vollständige Website zu sehen
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Passwort eingeben"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Website anzeigen
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Kontaktieren Sie uns für das Passwort
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Teaser Content */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Coming Soon
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Wir arbeiten an einer vollständigen Website mit allen Details zu unseren Projekten, 
                dem Team und aktuellen Neuigkeiten.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏗️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Projekte</h3>
                <p className="text-muted-foreground">
                  Detaillierte Einblicke in unsere Entwicklungsprojekte in Uganda
                </p>
              </Card>
              
              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Team</h3>
                <p className="text-muted-foreground">
                  Lernen Sie unser engagiertes Team kennen
                </p>
              </Card>
              
              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📰</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">News</h3>
                <p className="text-muted-foreground">
                  Aktuelle Updates und Geschichten aus der Gemeinschaft
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Teaser;
