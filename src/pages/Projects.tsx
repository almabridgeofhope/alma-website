import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Droplets, Sprout, BookOpen } from "lucide-react";

const Projects = () => {
  const projects = [
    {
      title: "Zugang zu sauberem Wasser",
      icon: Droplets,
      description: "Bau und Instandhaltung von Brunnen, um Gemeinden mit sauberem Trinkwasser zu versorgen.",
      goals: [
        "Versorgung von Haushalten mit sicherem Trinkwasser",
        "Reduzierung wasserbedingter Krankheiten",
        "Förderung lokaler Wassermanagement-Strukturen",
      ],
      impact: "Verbesserte Gesundheit, Zeitersparnis für Familien (v. a. Frauen & Kinder), langfristige Infrastruktur.",
      status: "Planungsphase / erste Standortanalyse abgeschlossen",
      image: "/placeholder.svg",
    },
    {
      title: "Viehversorgung & Landwirtschaft",
      icon: Sprout,
      description: "Gemeinschaftsprojekt zur Verbesserung der Tierhaltung und Futtermittelversorgung.",
      goals: [
        "Sicherstellung der Grundversorgung durch Milch und Fleisch",
        "Gemeinschaftliche Nutzung von Ressourcen",
        "Schulungen in nachhaltiger Tierhaltung",
      ],
      impact: "Langfristige Ernährungssicherheit und wirtschaftliche Unabhängigkeit.",
      status: "Erste Kooperation mit lokalen Farmergruppen läuft",
      image: "/placeholder.svg",
    },
    {
      title: "Financial Literacy & Schulprogramme",
      icon: BookOpen,
      description: "Aufbau eines Programms, das Jugendlichen und Erwachsenen Grundlagen zu Finanzen, Unternehmertum und nachhaltigem Wirtschaften vermittelt.",
      goals: [
        "Förderung finanzieller Eigenständigkeit",
        "Schulungen in Budgetplanung & Kleinunternehmertum",
        "Aufbau lokaler Lernzentren",
      ],
      impact: "Selbstständigkeit, Zukunftsperspektiven, Stärkung der Bildung.",
      status: "Workshops in Vorbereitung, erste Lehrmaterialien entwickelt",
      image: "/placeholder.svg",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-section bg-primary-light">
          <div className="max-w-content mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-center">
              Unsere Projekte
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-center leading-relaxed">
              Wir setzen konkrete Projekte um, die nachhaltige Entwicklung ermöglichen und lokale Gemeinschaften stärken.
            </p>
          </div>
        </section>

        {/* Projects */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="space-y-16">
              {projects.map((project, index) => {
                const Icon = project.icon;
                return (
                  <Card 
                    key={index} 
                    className="overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 hover:scale-[1.01]"
                  >
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="aspect-[4/3] overflow-hidden bg-primary-light">
                        <img 
                          src={project.image} 
                          alt={project.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">
                              {project.title}
                            </h3>
                          </div>
                          
                          <p className="text-muted-foreground mb-6 leading-relaxed">
                            {project.description}
                          </p>

                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-foreground mb-3">Ziele:</h4>
                            <ul className="space-y-2">
                              {project.goals.map((goal, i) => (
                                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{goal}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-foreground mb-2">Mehrwert:</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              {project.impact}
                            </p>
                          </div>

                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-foreground mb-2">Status:</h4>
                            <p className="text-muted-foreground">
                              {project.status}
                            </p>
                          </div>
                        </div>

                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button w-full">
                          Dieses Projekt unterstützen
                        </Button>
                      </div>
                    </div>
                  </Card>
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
