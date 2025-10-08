import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/hero-uganda-community.jpg";

const Team = () => {
  const { t } = useLanguage();
  
  const teamUganda = [
    {
      name: t("team.peter.name"),
      role: t("team.peter.role"),
      description: t("team.peter.description"),
      image: "/public/placeholder.svg",
    },
    {
      name: t("team.fiona.name"),
      role: t("team.fiona.role"),
      description: t("team.fiona.description"),
      image: "/public/placeholder.svg",
    },
    {
      name: t("team.member.name"),
      role: t("team.member.agriculture.role"),
      description: t("team.member.agriculture.description"),
      image: "/public/placeholder.svg",
    },
  ];

  const teamGermany = [
    {
      name: t("team.aaron.name"),
      role: t("team.aaron.role"),
      description: t("team.aaron.description"),
      image: "/public/placeholder.svg",
    },
    {
      name: t("team.clara.name"),
      role: t("team.clara.role"),
      description: t("team.clara.description"),
      image: "/public/placeholder.svg",
    },
    {
      name: t("team.member.name"),
      role: t("team.member.communication.role"),
      description: t("team.member.communication.description"),
      image: "/public/placeholder.svg",
    },
    {
      name: t("team.member.name"),
      role: t("team.member.fundraising.role"),
      description: t("team.member.fundraising.description"),
      image: "/alma-website/placeholder.svg",
    },
    {
      name: t("team.member.name"),
      role: t("team.member.project.role"),
      description: t("team.member.project.description"),
      image: "/public/placeholder.svg",
    },
    {
      name: t("team.member.name"),
      role: t("team.member.accounting.role"),
      description: t("team.member.accounting.description"),
      image: "/public/placeholder.svg",
    },
    {
      name: t("team.member.name"),
      role: t("team.member.volunteer.role"),
      description: t("team.member.volunteer.description"),
      image: "/public/placeholder.svg",
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
              {t("team.hero.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t("team.hero.subtitle")}
            </p>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                {t("team.intro.title")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                {t("team.intro.p1")}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("team.intro.p2")}
              </p>
            </div>
          </div>
        </section>

        {/* Team Uganda */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              {t("team.uganda.title")}
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
                    <h3 className="text-xl font-semibold text-foreground">
                      {member.name}
                    </h3>
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
              {t("team.germany.title")}
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
                    <h3 className="text-xl font-semibold text-foreground">
                      {member.name}
                    </h3>
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
