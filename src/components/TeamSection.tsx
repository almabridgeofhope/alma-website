import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import teamImage from "@/assets/team/team_2.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const TeamSection = () => {
  const { t } = useLanguage();

  return (
    <section id="team" className="pt-section pb-section bg-primary-light">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("team.title")}
          </h2>
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
            {/* Text content on the left */}
            <div className="flex-1 max-w-md space-y-6">
              <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
                <p>{t("team.subtitle")}</p>
                <p className="font-medium text-foreground">{t("team.cta")}</p>
              </div>
              
              <div>
                <Link 
                  to="/team"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
                  >
                    {t("team.button")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Portrait image on the right */}
            <div className="flex-1 max-w-sm">
              <div className="rounded-lg overflow-hidden shadow-card">
                <img 
                  src={teamImage} 
                  alt="Alma Bridge of Hope Team"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;