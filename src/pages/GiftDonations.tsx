import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import PreloadImage from "@/components/PreloadImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { Download, Mail, Gift, Users, MessageCircle } from "lucide-react";
import heroImage from "@/assets/community/community_2.webp";

const GiftDonations = () => {
  const { t } = useLanguage();
  const contactEmail = t("contact.email");
  const mailtoHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
    t("giftDonations.mail.subject")
  )}&body=${encodeURIComponent(t("giftDonations.mail.body"))}`;

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pt-16">
        {/* Hero */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <PreloadImage src={heroImage} />
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-hero" />

          <div className="relative z-10 text-center text-white max-w-4xl px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("giftDonations.hero.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              {t("giftDonations.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="secondary">
                <a href="/flyer.pdf" download target="_blank" rel="noopener noreferrer">
                  <Download />
                  {t("giftDonations.hero.primary")}
                </a>
              </Button>
              <Button asChild size="lg">
                <a href={mailtoHref}>
                  <Mail />
                  {t("giftDonations.hero.secondary")}
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {t("giftDonations.steps.title")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center shadow-card">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("giftDonations.steps.one.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("giftDonations.steps.one.desc")}
                </p>
              </Card>
              <Card className="p-6 text-center shadow-card">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("giftDonations.steps.two.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("giftDonations.steps.two.desc")}
                </p>
              </Card>
              <Card className="p-6 text-center shadow-card">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("giftDonations.steps.three.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("giftDonations.steps.three.desc")}
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Materials & Support */}
        <section className="py-section bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {t("giftDonations.support.title")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {t("giftDonations.support.flyer.title")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("giftDonations.support.flyer.desc")}
                    </p>
                    <Button asChild variant="outline">
                      <a href="/flyer.pdf" download target="_blank" rel="noopener noreferrer">
                        {t("giftDonations.support.flyer.cta")}
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
              <Card className="p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {t("giftDonations.support.contact.title")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("giftDonations.support.contact.desc")}
                    </p>
                    <Button asChild variant="outline">
                      <a href={mailtoHref}>{t("giftDonations.support.contact.cta")}</a>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <Card className="p-8 md:p-10 shadow-card">
              <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {t("giftDonations.contact.title")}
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    {t("giftDonations.contact.subtitle")}
                  </p>
                </div>
                <div className="flex md:justify-end">
                  <Button asChild size="lg">
                    <a href={mailtoHref}>
                      <Mail />
                      {t("giftDonations.contact.cta")}
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GiftDonations;
