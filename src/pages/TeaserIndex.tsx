import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Heart, Users, Globe, Mail, Instagram } from "lucide-react";
import logo from "@/assets/alma-logo.svg";
import { useState } from "react";
import NewsletterForm from "@/components/NewsletterForm";
import { useLanguage } from "@/contexts/LanguageContext";

const TeaserIndex = () => {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    
    try {
      // Einfache Lösung: E-Mail mit Newsletter-Anmeldung öffnen
      const subject = encodeURIComponent(t("teaser.newsletter.email.subject"));
      const date = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
      const bodyText = t("teaser.newsletter.email.body")
        .replace("{email}", email)
        .replace("{date}", date);
      const body = encodeURIComponent(bodyText);
      
      window.open(`mailto:info@almabridgeofhope.org?subject=${subject}&body=${body}`, '_blank');
      
      // Simuliere erfolgreiche Anmeldung
      setTimeout(() => {
        setIsSubscribed(true);
        setEmail("");
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Newsletter signup error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-content mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <img src={logo} alt="Alma Bridge of Hope" className="h-12 w-12 object-contain" />
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t("teaser.nav.about")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t("teaser.nav.contact")}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="pt-16">
        {/* Coming Soon Section - Prominent at the top */}
        <section className="relative py-20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
          
          <div className="relative z-10 text-center max-w-4xl px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight text-foreground">
              {t("teaser.comingSoon.title")}
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">
              {t("teaser.comingSoon.subtitle")}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("teaser.comingSoon.description")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t("teaser.comingSoon.learnMore")}
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 bg-muted/30">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {t("teaser.newsletter.title")}
            </h2>
            <p className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("teaser.newsletter.description")}
            </p>
            
            {/* Social Media & Newsletter Options */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
              {/* Instagram Card */}
              <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-pink-200" onClick={() => window.open('https://instagram.com/almabridgeofhope', '_blank')}>
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <Instagram className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{t("teaser.newsletter.instagram.title")}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {t("teaser.newsletter.instagram.description")}
                </p>
                <Button variant="outline" className="w-full">
                  @almabridgeofhope
                </Button>
              </Card>
              
              {/* Newsletter Card */}
              <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 cursor-pointer group">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{t("teaser.newsletter.newsletter.title")}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {t("teaser.newsletter.newsletter.description")}
                </p>
                
                <NewsletterForm 
                  placeholder={t("teaser.newsletter.emailPlaceholder")}
                  buttonLabel={t("teaser.newsletter.subscribe")}
                  source="teaser-index"
                />
              </Card>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-12 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {t("teaser.about.title")}
              </h2>
              <p className="text-base text-muted-foreground max-w-3xl mx-auto">
                {t("teaser.about.description")}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("teaser.about.utilities.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("teaser.about.utilities.description")}
                </p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("teaser.about.infrastructure.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("teaser.about.infrastructure.description")}
                </p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("teaser.about.education.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("teaser.about.education.description")}
                </p>
              </Card>
            </div>
          </div>
        </section>


        {/* Contact Section */}
        <section id="contact" className="py-12 bg-muted/30">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {t("teaser.contact.title")}
            </h2>
            <p className="text-base text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t("teaser.contact.description")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.open('mailto:info@almabridgeofhope.org', '_blank')}
              >
                {t("teaser.contact.sendEmail")}
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <img src={logo} alt="Alma Bridge of Hope" className="h-8 w-8 object-contain" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {t("teaser.footer.tagline")}
            </p>
            <div className="text-xs text-muted-foreground">
              {t("teaser.footer.copyright")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TeaserIndex;