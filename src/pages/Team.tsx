import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-uganda-community.jpg";

const Team = () => {
  const teamUganda = [
    {
      name: "Peter Ssenga",
      role: "Community Lead Uganda",
      description: "Peter koordiniert alle Projekte vor Ort und arbeitet eng mit lokalen Partnern zusammen, um nachhaltige Entwicklung zu ermöglichen.",
      image: "/placeholder.svg",
    },
    {
      name: "Fiona Nakazibwe",
      role: "Education & Community Programs",
      description: "Fiona entwickelt und leitet Bildungsprogramme, die der lokalen Gemeinschaft zu mehr Eigenständigkeit verhelfen.",
      image: "/placeholder.svg",
    },
    {
      name: "Teammitglied",
      role: "Agriculture & Infrastructure Support",
      description: "Unterstützung bei landwirtschaftlichen Projekten und nachhaltiger Infrastrukturentwicklung in den Gemeinden.",
      image: "/placeholder.svg",
    },
  ];

  const teamGermany = [
    {
      name: "Clara Thümecke",
      role: "Vorstand & Projektentwicklung",
      description: "Clara leitet die strategische Entwicklung und koordiniert die Zusammenarbeit zwischen Deutschland und Uganda.",
      image: "/placeholder.svg",
    },
    {
      name: "Aaron",
      role: "Finanzkoordination & Partnerschaften",
      description: "Aaron verwaltet die finanziellen Ressourcen und baut Partnerschaften mit Unterstützern und Organisationen auf.",
      image: "/placeholder.svg",
    },
    {
      name: "Teammitglied",
      role: "Öffentlichkeitsarbeit & Kommunikation",
      description: "Verantwortlich für die externe Kommunikation und das Aufbauen von Aufmerksamkeit für unsere Projekte.",
      image: "/placeholder.svg",
    },
    {
      name: "Teammitglied",
      role: "Fundraising & Spendenakquise",
      description: "Entwickelt Strategien zur Mittelbeschaffung und pflegt Beziehungen zu Förderern.",
      image: "/placeholder.svg",
    },
    {
      name: "Teammitglied",
      role: "Projektmanagement",
      description: "Koordiniert die Umsetzung der Projekte und sorgt für reibungslose Abläufe.",
      image: "/placeholder.svg",
    },
    {
      name: "Teammitglied",
      role: "Buchhaltung & Verwaltung",
      description: "Kümmert sich um die ordnungsgemäße Verwaltung und Dokumentation aller Finanzen.",
      image: "/placeholder.svg",
    },
    {
      name: "Teammitglied",
      role: "Ehrenamtliche Koordination",
      description: "Bindet Freiwillige ein und organisiert ehrenamtliche Unterstützung für Veranstaltungen.",
      image: "/placeholder.svg",
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
              Unser Team
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Gemeinsam Brücken bauen zwischen Uganda und Deutschland
            </p>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Internationale Zusammenarbeit
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Alma Bridge of Hope ist ein gemeinsames Projekt von engagierten Menschen aus Uganda und Deutschland. 
                Unsere Stärke liegt in der engen Zusammenarbeit zwischen beiden Ländern: Während unser Team in Uganda 
                die Projekte vor Ort umsetzt und die lokalen Gemeinschaften direkt unterstützt, koordiniert unser 
                deutsches Team die strategische Entwicklung, Mittelbeschaffung und internationale Partnerschaften.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Diese interkontinentale Kooperation ermöglicht es uns, nachhaltige Entwicklung zu fördern, 
                die wirklich von und mit den Menschen vor Ort gestaltet wird.
              </p>
            </div>
          </div>
        </section>

        {/* Team Uganda */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              Team Uganda
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {teamUganda.map((member, index) => (
                <Card key={index} className="overflow-hidden shadow-card hover:shadow-soft transition-shadow duration-300">
                  <div className="aspect-square overflow-hidden bg-primary-light">
                    <img 
                      src={member.image} 
                      alt={`${member.name} - ${member.role}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {member.name}
                    </h3>
                    <p className="text-primary font-medium mb-4">
                      {member.role}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Germany */}
        <section className="py-section bg-primary-light">
          <div className="max-w-content mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              Team Deutschland
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {teamGermany.map((member, index) => (
                <Card key={index} className="overflow-hidden shadow-card hover:shadow-soft transition-shadow duration-300">
                  <div className="aspect-square overflow-hidden bg-background">
                    <img 
                      src={member.image} 
                      alt={`${member.name} - ${member.role}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {member.name}
                    </h3>
                    <p className="text-primary font-medium mb-4">
                      {member.role}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Team;
