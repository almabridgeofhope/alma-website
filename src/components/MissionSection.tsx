import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const MissionSection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="about" className="py-section bg-muted">
      <div className="max-w-content mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            {t("mission.title")}
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>{t("mission.p1")}</p>
            <p>{t("mission.p2")}</p>
            <p>{t("mission.p3")}</p>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xl font-semibold text-foreground mb-6">
              {t("mission.cta")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
                >
                  {t("mission.contact")}
                </Button>
              </Link>
              <Link to="/projects">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="shadow-button"
                >
                  {t("mission.donate")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;