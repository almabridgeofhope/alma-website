import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/alma-logo.svg";
import { useLanguage } from "@/contexts/LanguageContext";
import NewsletterForm from "@/components/NewsletterForm";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isDonationPage = location.pathname === '/donation';

  // Handler for navigation links that works even when PayPal intercepts clicks
  const handleFooterNavClick = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // On donation page, use window.location to bypass PayPal SDK interference
    if (isDonationPage) {
      console.log('[Footer] Force navigating from donation page to:', path);
      // Clear any stale redirect paths
      sessionStorage.removeItem('404-redirect-path');
      // Use window.location.href for guaranteed navigation (preserves history)
      window.location.href = path;
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // For non-donation pages, use React Router navigation
      navigate(path);
    }
  };

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
              <img src={logo} alt="Alma Bridge of Hope e.V." width={48} height={48} className="h-12 w-12 object-contain" />
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
                to="/" 
                className="block text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => handleFooterNavClick("/", e)}
              >
                {t("nav.home")}
              </Link>
              <Link 
                to="/projects" 
                className="block text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => handleFooterNavClick("/projects", e)}
              >
                {t("nav.projects")}
              </Link>
              <Link 
                to="/about" 
                className="block text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => handleFooterNavClick("/about", e)}
              >
                {t("nav.about")}
              </Link>
              <Link 
                to="/contact" 
                className="block text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => handleFooterNavClick("/contact", e)}
              >
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
                size="sm"
                className="w-full"
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
              <Link 
                to="/impressum" 
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => handleFooterNavClick("/impressum", e)}
              >
                {t("footer.legal.impressum")}
              </Link>
              <Link 
                to="/privacy" 
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => handleFooterNavClick("/privacy", e)}
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