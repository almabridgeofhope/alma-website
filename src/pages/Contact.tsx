import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PreloadImage from "@/components/PreloadImage";
import { Mail, MapPin, Instagram, Landmark } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/nature/land_11.webp";
import KontaktFormular from "@/components/KontaktFormular";

const Contact = () => {
  const { t } = useLanguage();

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
              {t("contact.hero.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t("contact.hero.subtitle")}
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="pt-section pb-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card className="p-8 shadow-card">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("contact.form.title")}
                </h2>
                <KontaktFormular />
              </Card>

              {/* Contact Information */}
              <div className="space-y-8">
                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t("contact.info.email")}
                      </h3>
                      <a 
                        href="mailto:info@almabridgeofhope.org"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@almabridgeofhope.org
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t("contact.info.address")}
                      </h3>
                      <p className="text-muted-foreground">
                        Alma Bridge of Hope e.V.<br />
                        Ferchensee 8<br />
                        83562 Rechtmehring<br />
                        Deutschland
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Instagram className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t("contact.info.social")}
                      </h3>
                      <a
                        href="https://instagram.com/almabridgeofhope"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        @almabridgeofhope
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Landmark className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t("contact.info.bank")}
                      </h3>
                      <p className="text-muted-foreground text-sm space-y-0.5">
                        <span className="block">Alma Bridge of Hope e.V.</span>
                        <span className="block">Bank: Wise</span>
                        <span className="block font-mono">IBAN: BE37 9030 0023 0728</span>
                        <span className="block font-mono">BIC: TRWIBEB1XXX</span>
                      </p>
                    </div>
                  </div>
                </Card>

              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
