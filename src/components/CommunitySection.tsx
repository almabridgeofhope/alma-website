import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Users, Heart } from "lucide-react";

const CommunitySection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="community" className="py-section bg-muted/30">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("community.title")}
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Community Information */}
          <div className="space-y-6">
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>{t("community.description1")}</p>
              <p>{t("community.description2")}</p>
              <p>{t("community.description3")}</p>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-2 gap-6 pt-6">
              <Card className="p-6 text-center bg-primary-light/30">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-primary mb-1">150+</div>
                <div className="text-sm text-muted-foreground">{t("community.stats.people")}</div>
              </Card>
              <Card className="p-6 text-center bg-primary-light/30">
                <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-primary mb-1">4</div>
                <div className="text-sm text-muted-foreground">{t("community.stats.projects")}</div>
              </Card>
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-6">
            <Card className="overflow-hidden shadow-card">
              <div className="aspect-[4/3] bg-muted relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7!2d32.851!3d0.602!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMzYnMDguOSJOIDMywrA1MScwMy4wIkU!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Community Location"
                  className="w-full h-full"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("community.location.title")}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  {t("community.location.coordinates")}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("community.location.region")}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
