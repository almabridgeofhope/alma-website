import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Home, Droplets, Sprout, BookOpen } from "lucide-react";
import heroImage from "@/assets/infrastructure-well.jpg";
import communityHouseImage from "@/assets/hero-uganda-community.jpg";
import waterImage from "@/assets/infrastructure-well.jpg";
import agricultureImage from "@/assets/utilities-solar.jpg";
import educationImage from "@/assets/education-classroom.jpg";

type TimelinePhase = "planning" | "building" | "implementation" | "impact";

interface Project {
  title: string;
  icon: typeof Home;
  teaser: string;
  description: string;
  goals: string[];
  impact: string;
  statusText: string;
  statusIcon: string;
  progress: number;
  currentPhase: TimelinePhase;
  image: string;
  buttonText: string;
  priority: "active" | "planned";
}

const Projects = () => {
  const timelinePhases = [
    { id: "planning", icon: "🌱", label: "Planung" },
    { id: "building", icon: "🔧", label: "Aufbau" },
    { id: "implementation", icon: "💧", label: "Umsetzung" },
    { id: "impact", icon: "🌾", label: "Wirkung" },
  ];

  const activeProjects: Project[] = [
    {
      title: "Community House",
      icon: Home,
      teaser: "Das Herzstück unserer Initiative",
      description: "Das Community House ist das Herzstück unserer Initiative. Es dient als Treffpunkt, Schulungszentrum und Ausgangspunkt für alle Programme – hier entsteht Raum für Bildung, Zusammenarbeit und nachhaltige Entwicklung.",
      goals: [
        "Bau eines zentralen Hauses mit Lern- und Gemeinschaftsräumen",
        "Standort für Brunnen & Viehzuchtprojekt",
        "Einrichtung von Lager- und Büroräumen",
      ],
      impact: "Ein sicherer Ort für Austausch, Bildung und lokale Eigenständigkeit.",
      statusText: "Aufbauphase",
      statusIcon: "🟢",
      progress: 65,
      currentPhase: "building",
      image: communityHouseImage,
      buttonText: "Mehr erfahren",
      priority: "active",
    },
    {
      title: "Brunnenprojekt",
      icon: Droplets,
      teaser: "Zugang zu sauberem Wasser",
      description: "Sauberes Wasser ist die Grundlage für Gesundheit und Bildung. Wir errichten einen Brunnen in der Nähe des Community House, um die Grundversorgung der Dorfgemeinschaft sicherzustellen.",
      goals: [
        "Versorgung mit sauberem Trinkwasser",
        "Verringerung wasserbedingter Krankheiten",
        "Aufbau lokaler Wartungsstrukturen",
      ],
      impact: "Verbesserte Lebensqualität für über 150 Menschen in der Region Wakiso.",
      statusText: "Vorbereitungsphase – Standortprüfung abgeschlossen",
      statusIcon: "🟢",
      progress: 35,
      currentPhase: "planning",
      image: waterImage,
      buttonText: "Projekt unterstützen 💧",
      priority: "active",
    },
  ];

  const plannedProjects: Project[] = [
    {
      title: "Viehversorgung & Landwirtschaft",
      icon: Sprout,
      teaser: "Nachhaltige Ernährungssicherheit",
      description: "Gemeinschaftliche Viehhaltung und nachhaltige Landwirtschaft sichern Ernährung und Einkommen für viele Familien.",
      goals: [
        "Aufbau gemeinsamer Futterlager",
        "Tierärztliche Versorgung verbessern",
        "Schulungen für nachhaltige Tierhaltung",
      ],
      impact: "Langfristige Ernährungssicherheit & wirtschaftliche Unabhängigkeit.",
      statusText: "In Vorbereitung – Kooperativen bilden sich",
      statusIcon: "🟡",
      progress: 20,
      currentPhase: "planning",
      image: agricultureImage,
      buttonText: "Mehr erfahren 🐄",
      priority: "planned",
    },
    {
      title: "Financial Literacy & Bildung",
      icon: BookOpen,
      teaser: "Der Schlüssel zu Selbstständigkeit",
      description: "Finanzielle Bildung ist der Schlüssel zu Selbstständigkeit. Wir entwickeln Trainings und Lernzentren, um Jugendliche und Erwachsene zu stärken.",
      goals: [
        "Trainings zu Finanzen & Budgetplanung",
        "Aufbau lokaler Lernräume",
        "Partnerschaften mit Schulen",
      ],
      impact: "Mehr als 100 Jugendliche sollen Zugang zu praxisnaher Finanzbildung erhalten.",
      statusText: "In Vorbereitung – Lehrmaterialien erstellt",
      statusIcon: "⚪",
      progress: 15,
      currentPhase: "planning",
      image: educationImage,
      buttonText: "Unterstütze Bildung 📚",
      priority: "planned",
    },
  ];

  const renderTimeline = (currentPhase: TimelinePhase) => (
    <div className="flex items-center justify-between mb-6 relative">
      {timelinePhases.map((phase, index) => {
        const isActive = phase.id === currentPhase;
        const isPast = timelinePhases.findIndex(p => p.id === currentPhase) > index;
        
        return (
          <div key={phase.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center relative z-10">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                    : isPast
                    ? "bg-primary/60 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {phase.icon}
              </div>
              <span 
                className={`text-sm mt-2 font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {phase.label}
              </span>
            </div>
            {index < timelinePhases.length - 1 && (
              <div 
                className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                  isPast ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderProjectCard = (project: Project, index: number) => {
    const Icon = project.icon;
    const isEven = index % 2 === 0;
    
    return (
      <div 
        key={index}
        className="animate-fade-in"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <Card className={`overflow-hidden shadow-card hover:shadow-soft transition-all duration-500 group ${
          project.priority === "active" ? "bg-primary-light/30" : "bg-card"
        }`}>
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
            <div className="p-8 md:p-10 flex flex-col justify-between">
              <div>
                {/* Header with Icon and Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-foreground">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground italic">
                        {project.teaser}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl">{project.statusIcon}</span>
                </div>
                
                {/* Description */}
                <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                  {project.description}
                </p>

                {/* Two Column Layout: Goals & Impact */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Goals */}
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      Ziele
                    </h4>
                    <ul className="space-y-2">
                      {project.goals.map((goal, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-1 text-lg">•</span>
                          <span className="leading-relaxed">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact */}
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      Impact
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {project.impact}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                {renderTimeline(project.currentPhase)}

                {/* Status Card with Progress */}
                <div className="p-4 bg-background rounded-lg border border-border mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Status: {project.statusText}
                    </h4>
                    <span className="text-sm font-bold text-primary">
                      {project.progress}%
                    </span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
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
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
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
              Jedes Projekt ist ein Schritt zu einer selbstbestimmten Zukunft. Gemeinsam schaffen wir Strukturen, die Bestand haben – von Wasser über Bildung bis Gemeinschaft.
            </p>
          </div>
        </section>

        {/* Active Projects Section */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Aktuelle Projekte
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>
            
            <div className="space-y-16">
              {activeProjects.map((project, index) => renderProjectCard(project, index))}
            </div>
          </div>
        </section>

        {/* Planned Projects Section */}
        <section className="py-section bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Weitere geplante Initiativen
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>
            
            <div className="space-y-16">
              {plannedProjects.map((project, index) => renderProjectCard(project, index + activeProjects.length))}
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Unsere Wirkung
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-8" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="text-center p-6 bg-primary-light rounded-lg">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">4</div>
                <div className="text-sm md:text-base text-muted-foreground">Projekte</div>
              </div>
              <div className="text-center p-6 bg-primary-light rounded-lg">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">2</div>
                <div className="text-sm md:text-base text-muted-foreground">Aktiv im Bau</div>
              </div>
              <div className="text-center p-6 bg-primary-light rounded-lg">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">150+</div>
                <div className="text-sm md:text-base text-muted-foreground">Menschen erreicht</div>
              </div>
              <div className="text-center p-6 bg-primary-light rounded-lg">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">40+</div>
                <div className="text-sm md:text-base text-muted-foreground">Engagierte & Freiwillige</div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xl text-foreground mb-6">
                Hilf uns, noch mehr Wirkung zu entfalten.
              </p>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button text-lg px-8 py-6"
              >
                Jetzt spenden
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Projects;
