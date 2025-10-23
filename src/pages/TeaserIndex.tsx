import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Heart, Users, Globe } from "lucide-react";

const TeaserIndex = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-content mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold text-primary">Alma Bridge of Hope</div>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
              <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
          
          <div className="relative z-10 text-center max-w-4xl px-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground">
              Alma Bridge of Hope
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Building bridges of hope across continents through sustainable community development
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button text-lg px-8 py-6"
                onClick={() => window.open('https://dev.almabridgeofhope.org', '_blank')}
              >
                Vollständige Website ansehen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Mehr erfahren
              </Button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Über Alma Bridge of Hope
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Wir sind eine gemeinnützige Organisation, die sich für nachhaltige Entwicklung 
                und Gemeinschaftsaufbau in Uganda einsetzt. Unser Ziel ist es, Brücken der Hoffnung 
                zwischen Deutschland und Uganda zu schaffen.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Gemeinschaft</h3>
                <p className="text-muted-foreground">
                  Wir stärken lokale Gemeinschaften durch partizipative Entwicklungsansätze
                </p>
              </Card>
              
              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Bildung</h3>
                <p className="text-muted-foreground">
                  Zugang zu qualitativ hochwertiger Bildung für alle Altersgruppen
                </p>
              </Card>
              
              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nachhaltigkeit</h3>
                <p className="text-muted-foreground">
                  Umweltfreundliche und langfristig tragfähige Lösungen
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Vollständige Website in Kürze
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Wir arbeiten an einer umfassenden Website mit detaillierten Informationen 
                zu unseren Projekten, dem Team und aktuellen Neuigkeiten.
              </p>
            </div>
            
            <div className="bg-primary/5 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Was Sie erwarten können:
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">📰 Aktuelle News</h4>
                  <p className="text-muted-foreground text-sm">
                    Regelmäßige Updates über unsere Projekte und die Gemeinschaft
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">🏗️ Projekt-Details</h4>
                  <p className="text-muted-foreground text-sm">
                    Detaillierte Einblicke in unsere Entwicklungsprojekte
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">👥 Team-Vorstellung</h4>
                  <p className="text-muted-foreground text-sm">
                    Lernen Sie unser engagiertes Team kennen
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">💝 Spenden</h4>
                  <p className="text-muted-foreground text-sm">
                    Sichere Möglichkeiten, unsere Arbeit zu unterstützen
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Kontakt
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Haben Sie Fragen oder möchten Sie mehr über unsere Arbeit erfahren? 
              Wir freuen uns auf Ihre Nachricht.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button text-lg px-8 py-6"
                onClick={() => window.open('mailto:info@almabridgeofhope.org', '_blank')}
              >
                E-Mail senden
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => window.open('https://dev.almabridgeofhope.org/#contact', '_blank')}
              >
                Vollständige Kontaktseite
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-4">Alma Bridge of Hope</div>
            <p className="text-muted-foreground mb-4">
              Building bridges of hope across continents
            </p>
            <div className="text-sm text-muted-foreground">
              © 2024 Alma Bridge of Hope. Alle Rechte vorbehalten.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TeaserIndex;