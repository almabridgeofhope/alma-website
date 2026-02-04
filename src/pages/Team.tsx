import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import OptimizedImage from "@/components/OptimizedImage";
import PreloadImage from "@/components/PreloadImage";
import DictionaryDefinition from "@/components/DictionaryDefinition";
import heroImage from "@/assets/community/community_5.webp";
import phionaImage from "@/assets/team/phiona.webp";
import tonyImage from "@/assets/team/tony.webp";
import peterImage from "@/assets/team/peter.webp";
import claraImage from "@/assets/team/clara.webp";
import aaronImage from "@/assets/team/aaron.jpeg";
import tanjaImage from "@/assets/team/tanja.jpeg";
import hansenImage from "@/assets/team/hansen.jpeg";
import maxImage from "@/assets/team/max.jpeg";
import yuanImage from "@/assets/team/yuan.jpeg";
import eileenImage from "@/assets/team/eileen.jpeg";
import teamAaronPhionah from "@/assets/team/team.webp";
import teamPeter from "@/assets/team/team_2.jpg";
import teamPeterTony from "@/assets/team/team_3.jpg";

const Team = () => {
  const { t } = useLanguage();
  
  const originImages = [
    { src: teamAaronPhionah, alt: "Aaron & Phionah" },
    { src: teamPeter, alt: "Peter", objectPositionClass: "object-[center_25%]" },
    { src: teamPeterTony, alt: "Tony, Kisutu & Peter" },
  ];

  const teamUganda = [
    {
      name: t("team.peter.name"),
      image: peterImage,
      bio: t("team.peter.bio").split("|"),
    },
    {
      name: t("team.phionah.name"),
      image: phionaImage,
      bio: t("team.phionah.bio").split("|"),
    },
    {
      name: t("team.tony.name"),
      image: tonyImage,
      bio: t("team.tony.bio").split("|"),
    },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const teamGermany = [
    {
      name: t("team.aaron.name"),
      image: aaronImage,
    },
    {
      name: t("team.clara.name"),
      image: claraImage,
    },
    {
      name: t("team.eileen.name"),
      image: eileenImage,
    },
    {
      name: t("team.hansen.name"),
      image: hansenImage,
    },
    {
      name: t("team.max.name"),
      image: maxImage,
    },
    {
      name: t("team.tanja.name"),
      image: tanjaImage,
    },
    {
      name: t("team.yuan.name"),
      image: yuanImage,
    },
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section with Background Image */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <PreloadImage src={heroImage} />
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          
          <div className="relative z-10 text-center text-white max-w-4xl px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("team.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t("team.hero.subtitle")}
            </p>
          </div>
        </section>

        {/* Introduction Section with Dictionary Definition */}
        <section className="pt-section pb-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="grid lg:grid-cols-[1fr,1.8fr] gap-8 lg:gap-10 items-stretch">
              {/* Dictionary Definition - left side */}
              <div className="lg:sticky lg:top-24 h-full">
                <DictionaryDefinition className="h-full" />
              </div>
              
              {/* Introduction Text - right side */}
              <div className="space-y-6 flex flex-col">
                <h2 className="text-3xl font-bold text-foreground">
                  {t("team.intro.title")}
                </h2>
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed flex-1">
                  <p>{t("team.intro.p1")}</p>
                  <p>{t("team.intro.p2")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Origin Story */}
        <section className="py-section bg-muted">
          <div className="max-w-content mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[1.6fr,1fr] items-start">
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <h2 className="text-3xl font-bold text-foreground">
                  {t("team.origin.title")}
                </h2>
                <div className="space-y-4">
                  <p>{t("team.origin.p1")}</p>
                  <p>{t("team.origin.p2")}</p>
                  <p>{t("team.origin.p3")}</p>
                  <p>{t("team.origin.p4")}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:self-start lg:max-h-full">
                {originImages.map((image, index) => (
                  <div
                    key={index}
                    className="flex flex-col overflow-hidden rounded-lg shadow-card"
                  >
                    <OptimizedImage
                      src={image.src}
                      alt={image.alt || "Team-Mitglieder von Alma Bridge of Hope bei der Arbeit"}
                      aspectRatio="3/2"
                      className={["h-full w-full object-cover", image.objectPositionClass]
                        .filter(Boolean)
                        .join(" ")}
                      lazy={true}
                    />
                    <div className="mt-2 px-2 pb-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {image.alt || t("images.team.members")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Uganda */}
        <section className="pt-section pb-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              {t("team.uganda.title")}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {teamUganda.map((member, index) => (
                <Card
                  key={index}
                  tabIndex={0}
                  className="group overflow-hidden shadow-card hover:shadow-soft transition-shadow duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-primary-light">
                    <OptimizedImage
                      src={member.image} 
                      alt={`Porträtfoto von ${member.name}, Team-Mitglied von Alma Bridge of Hope`}
                      aspectRatio="1/1"
                      className="w-full h-full object-cover"
                      lazy={true}
                    />
                    <div className="absolute inset-0 bg-foreground/85 text-white opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
                      <div className="flex h-full w-full flex-col overflow-y-auto px-5 py-6 text-sm leading-relaxed gap-3">
                        {member.bio.map((paragraph, bioIndex) => (
                          <p key={bioIndex}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
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
        <section className="pt-section pb-section bg-primary-light">
          <div className="max-w-content mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              {t("team.germany.title")}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {teamGermany.map((member, index) => (
                <Card key={index} className="overflow-hidden shadow-card hover:shadow-soft transition-shadow duration-300">
                  <div className="aspect-square overflow-hidden bg-background">
                    <OptimizedImage
                      src={member.image} 
                      alt={`Porträtfoto von ${member.name}, Team-Mitglied von Alma Bridge of Hope`}
                      aspectRatio="1/1"
                      className="w-full h-full object-cover"
                      lazy={true}
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
