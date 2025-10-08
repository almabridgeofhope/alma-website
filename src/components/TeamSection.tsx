import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/community_house.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const TeamSection = () => {
  const { t } = useLanguage();

  return (
    <section id="team" className="py-section bg-primary-light">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("team.title")}
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-lg text-muted-foreground leading-relaxed space-y-4">
            <p>{t("team.subtitle")}</p>
            <p className="font-medium text-foreground">{t("team.cta")}</p>
          </div>

          <div className="mb-8 rounded-lg overflow-hidden shadow-card">
            <img 
              src={heroImage} 
              alt="Alma Bridge of Hope Team"
              className="w-full h-auto"
            />
          </div>

          <div className="text-center">
            <Link to="/team">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
              >
                {t("team.button")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;