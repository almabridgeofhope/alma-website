import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/alma-logo.svg";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Please enter your email",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Thank you for subscribing!",
      description: "You'll receive monthly updates from our team.",
    });
    
    setEmail("");
  };

  return (
    <footer className="bg-muted py-12">
      <div className="max-w-content mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <img src={logo} alt="Alma Bridge of Hope" className="h-12 w-12 object-contain" />
            </div>
            <p className="text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.nav.title")}</h4>
            <nav className="space-y-2">
              <Link to="/" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.home")}
              </Link>
              <Link to="/projects" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.projects")}
              </Link>
              <Link to="/team" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.team")}
              </Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.contact")}
              </Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("newsletter.title")}</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder={t("newsletter.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                {t("newsletter.button")}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">{t("footer.copyright")}</p>
            <nav className="flex gap-6 text-sm">
              <a href="#impressum" className="text-muted-foreground hover:text-primary transition-colors">
                {t("footer.legal.impressum")}
              </a>
              <a href="#privacy" className="text-muted-foreground hover:text-primary transition-colors">
                {t("footer.legal.privacy")}
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;