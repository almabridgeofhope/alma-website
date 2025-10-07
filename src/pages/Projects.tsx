import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Droplets, Sprout, BookOpen } from "lucide-react";
import heroImage from "@/assets/infrastructure-well.jpg";
import waterImage from "@/assets/infrastructure-well.jpg";
import agricultureImage from "@/assets/utilities-solar.jpg";
import educationImage from "@/assets/education-classroom.jpg";

const Projects = () => {
  const projects = [
    {
      title: "Zugang zu sauberem Wasser",
      icon: Droplets,
      intro: "Sauberes Wasser ist die Grundlage für Gesundheit, Bildung und ein würdevolles Leben.",
      goals: [
        "Zugang zu sauberem Trinkwasser schaffen",
        "Krankheiten durch verschmutztes Wasser reduzieren",
        "Gemeinschaftliche Verantwortung für Wasserversorgung fördern",
      ],
      impact: "Über 150 Menschen in der Region Wakiso profitieren künftig von sauberem Wasser und besserer Lebensqualität.",
      status: "Standortanalyse abgeschlossen, lokale Baufirma beauftragt.",
      image: waterImage,
      buttonText: "Projekt unterstützen 💧",
    },
    {
      title: "Viehversorgung & Landwirtschaft",
      icon: Sprout,
      intro: "Durch gemeinschaftliche Viehhaltung und nachhaltige Landwirtschaft stärken wir die Ernährungssicherheit.",
      goals: [
        "Aufbau gemeinsamer Futterlager",
        "Verbesserung tierärztlicher Betreuung",
        "Schulungen für lokale Farmer",
      ],
      impact: "Familien erhalten stabile Einkommensquellen und Zugang zu nahrhaften Lebensmitteln.",
      status: "Erste Kooperativen gebildet, Schulungen starten im nächsten Quartal.",
      image: agricultureImage,
      buttonText: "Mehr erfahren 🐄",
    },
    {
      title: "Financial Literacy & Bildung",
      icon: BookOpen,
      intro: "Bildung ist der Schlüssel zu langfristiger Selbstständigkeit.",
      goals: [
        "Trainings zu Finanzen, Unternehmertum und Haushaltsführung",
        "Aufbau lokaler Lernzentren",
        "Zusammenarbeit mit Schulen",
      ],
      impact: "Über 100 Jugendliche erhalten Zugang zu praxisnaher Finanzbildung.",
      status: "Workshops in Planung, erste Materialien entwickelt.",
      image: educationImage,
      buttonText: "Unterstütze Bildung 📚",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section with Background Image */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          
          <div className="relative z-10 text-center text-white max-w-4xl px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Unsere Projekte
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Konkrete Initiativen für nachhaltige Entwicklung in Uganda
            </p>
          </div>
        </section>

        {/* Projects Section */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="space-y-20">
              {projects.map((project, index) => {
                const Icon = project.icon;
                const isEven = index % 2 === 0;
                
                return (
                  <div 
                    key={index}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Card className="overflow-hidden shadow-card hover:shadow-soft transition-all duration-500 group">
                      <div className={`grid md:grid-cols-2 gap-0 ${!isEven ? 'md:grid-flow-dense' : ''}`}>
                        {/* Image Section */}
                        <div className={`relative aspect-[4/3] overflow-hidden ${!isEven ? 'md:col-start-2' : ''}`}>
                          <img 
                            src={project.image} 
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        {/* Content Section */}
                        <div className="p-8 md:p-10 flex flex-col justify-between bg-card">
                          <div>
                            {/* Header with Icon */}
                            <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                                <Icon className="w-8 h-8 text-primary" />
                              </div>
                              <h3 className="text-3xl font-bold text-foreground">
                                {project.title}
                              </h3>
                            </div>
                            
                            {/* Intro Text */}
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed italic">
                              {project.intro}
                            </p>

                            {/* Goals */}
                            <div className="mb-6">
                              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full" />
                                Ziele
                              </h4>
                              <ul className="space-y-3">
                                {project.goals.map((goal, i) => (
                                  <li key={i} className="flex items-start gap-3 text-muted-foreground group/item">
                                    <span className="text-primary mt-1 text-xl group-hover/item:scale-125 transition-transform">•</span>
                                    <span className="leading-relaxed">{goal}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Impact */}
                            <div className="mb-6 p-4 bg-primary-light rounded-lg border-l-4 border-primary">
                              <h4 className="text-lg font-semibold text-foreground mb-2">Impact</h4>
                              <p className="text-muted-foreground leading-relaxed">
                                {project.impact}
                              </p>
                            </div>

                            {/* Status */}
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-foreground/70 mb-1">Aktueller Status</h4>
                              <p className="text-muted-foreground">
                                {project.status}
                              </p>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <Button 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button w-full text-lg py-6 group-hover:scale-[1.02] transition-transform"
                          >
                            {project.buttonText}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Projects;
