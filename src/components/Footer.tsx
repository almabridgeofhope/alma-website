import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/alma-logo.svg";
import { useLanguage } from "@/contexts/LanguageContext";
import NewsletterForm from "@/components/NewsletterForm";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();
  const location = useLocation();
  
  // Check if we're on the /dev routes
  const isDevRoute = location.pathname.startsWith('/dev');
  const basePath = isDevRoute ? '/dev' : '';

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
              <Link 
                to={basePath + "/"} 
                className="block text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {t("nav.home")}
              </Link>
              <Link 
                to={basePath + "/projects"} 
                className="block text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {t("nav.projects")}
              </Link>
              <Link 
                to={basePath + "/about"} 
                className="block text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {t("nav.about")}
              </Link>
              <Link 
                to={basePath + "/contact"} 
                className="block text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {t("nav.contact")}
              </Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("newsletter.title")}</h4>
            <NewsletterForm 
              placeholder={t("newsletter.placeholder")}
              buttonLabel={t("newsletter.button")}
              source="website-footer"
            />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">{t("footer.copyright")}</p>
            <nav className="flex gap-6 text-sm">
              <Link 
                to={basePath + "/impressum"} 
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {t("footer.legal.impressum")}
              </Link>
              <Link 
                to={basePath + "/privacy"} 
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {t("footer.legal.privacy")}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;