import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Heart, Users, Globe, Mail } from "lucide-react";
import logo from "@/assets/alma-logo.svg";
import { useState } from "react";

const TeaserIndex = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    
    try {
      // Einfache Lösung: E-Mail mit Newsletter-Anmeldung öffnen
      const subject = encodeURIComponent('Newsletter Anmeldung');
      const body = encodeURIComponent(`Ich möchte den Newsletter abonnieren.

Meine E-Mail-Adresse: ${email}
Datum: ${new Date().toLocaleDateString('de-DE')}

Bitte fügen Sie mich zu Ihrer Newsletter-Liste hinzu.

Vielen Dank!`);
      
      window.open(`mailto:info@almabridgeofhope.org?subject=${subject}&body=${body}`, '_blank');
      
      // Simuliere erfolgreiche Anmeldung
      setTimeout(() => {
        setIsSubscribed(true);
        setEmail("");
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Newsletter signup error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-content mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <img src={logo} alt="Alma Bridge of Hope" className="h-12 w-12 object-contain" />
            </div>
            <div className="flex items-center space-x-6">
              <button 
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                About
              </button>
              <button 
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="pt-16">
        {/* Coming Soon Section - Prominent at the top */}
        <section className="relative py-20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
          
          <div className="relative z-10 text-center max-w-4xl px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight text-foreground">
              Coming Soon
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">
              Alma Bridge of Hope
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Wir arbeiten an einer vollständigen Website mit detaillierten Informationen 
              zu unseren Projekten und aktuellen Neuigkeiten.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base px-6 py-4"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Mehr erfahren
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 bg-muted/30">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Newsletter
            </h2>
            <p className="text-base text-muted-foreground mb-6 max-w-2xl mx-auto">
              Bleiben Sie auf dem Laufenden über unsere Projekte und Neuigkeiten. 
              Melden Sie sich für unseren Newsletter an.
            </p>
            
            {isSubscribed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Erfolgreich angemeldet!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Vielen Dank für Ihre Anmeldung zum Newsletter.
                </p>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Ihre E-Mail-Adresse"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? "Wird angemeldet..." : "Anmelden"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-12 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Über Alma Bridge of Hope
              </h2>
              <p className="text-base text-muted-foreground max-w-3xl mx-auto">
                Wir sind eine gemeinnützige Organisation, die sich für nachhaltige Entwicklung 
                und Gemeinschaftsaufbau in Uganda einsetzt. Unser Ziel ist es, Brücken der Hoffnung 
                zwischen Deutschland und Uganda zu schaffen.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Gemeinschaft</h3>
                <p className="text-sm text-muted-foreground">
                  Wir stärken lokale Gemeinschaften durch partizipative Entwicklungsansätze
                </p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Bildung</h3>
                <p className="text-sm text-muted-foreground">
                  Zugang zu qualitativ hochwertiger Bildung für alle Altersgruppen
                </p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nachhaltigkeit</h3>
                <p className="text-sm text-muted-foreground">
                  Umweltfreundliche und langfristig tragfähige Lösungen
                </p>
              </Card>
            </div>
          </div>
        </section>


        {/* Contact Section */}
        <section id="contact" className="py-12 bg-muted/30">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Kontakt
            </h2>
            <p className="text-base text-muted-foreground mb-6 max-w-2xl mx-auto">
              Haben Sie Fragen oder möchten Sie mehr über unsere Arbeit erfahren? 
              Wir freuen uns auf Ihre Nachricht.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button text-base px-6 py-4"
                onClick={() => window.open('mailto:info@almabridgeofhope.org', '_blank')}
              >
                E-Mail senden
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <img src={logo} alt="Alma Bridge of Hope" className="h-8 w-8 object-contain" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Building bridges of hope across continents
            </p>
            <div className="text-xs text-muted-foreground">
              © 2025 Alma Bridge of Hope. Alle Rechte vorbehalten.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TeaserIndex;