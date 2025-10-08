import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ContactSection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="contact" className="py-section bg-background">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            {t("contact.title")}
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-8">
            <p className="text-lg text-muted-foreground">
              {t("contact.subtitle")}
            </p>

            <div className="flex justify-center">
              <Link to="/contact">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
                >
                  {t("contact.button")}
                </Button>
              </Link>
            </div>

            <div className="pt-8 border-t border-border">
              <p className="text-muted-foreground">
                {t("contact.note")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;