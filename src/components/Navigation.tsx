import { useState, useEffect, useRef } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/alma-logo.svg";
import { useLanguage } from "@/contexts/LanguageContext";
import { DonateCartButton, CartBadge } from "@/components/CartSidebar";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isDonationPage = location.pathname === '/donation';
  
  // Refs for navigation buttons on donation page
  const homeRef = useRef<HTMLButtonElement>(null);
  const projectsRef = useRef<HTMLButtonElement>(null);
  const newsRef = useRef<HTMLButtonElement>(null);
  const aboutRef = useRef<HTMLButtonElement>(null);
  const contactRef = useRef<HTMLButtonElement>(null);
  const logoRef = useRef<HTMLButtonElement>(null);
  
  // Handler for navigation links that works even when PayPal intercepts clicks
  const handleNavClick = (path: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // On donation page, use window.location to bypass PayPal SDK interference
    if (isDonationPage) {
      console.log('[Navigation] Force navigating from donation page to:', path);
      // Clear any stale redirect paths
      sessionStorage.removeItem('404-redirect-path');
      // Use window.location.href for guaranteed navigation (preserves history)
      window.location.href = path;
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(path);
    }
  };
  
  // Attach document-level listener in capture phase to bypass PayPal interception
  useEffect(() => {
    if (!isDonationPage) return;
    
    // Helper to build button map with current refs
    const buildButtonMap = () => {
      const buttonMap = new Map<HTMLButtonElement, string>();
      
      const addButton = (ref: React.RefObject<HTMLButtonElement>, path: string) => {
        const button = ref.current;
        if (button) {
          buttonMap.set(button, path);
        }
      };
      
      // Add all buttons to the map
      addButton(homeRef, '/');
      addButton(projectsRef, '/projects');
      addButton(newsRef, '/news');
      addButton(aboutRef, '/about');
      addButton(contactRef, '/contact');
      addButton(logoRef, '/');
      
      return buttonMap;
    };
    
    // Document-level handler in capture phase - runs before PayPal can intercept
    const documentHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Rebuild button map each time to ensure we have latest refs
      const buttonMap = buildButtonMap();
      
      // Find if the click is on one of our navigation buttons
      for (const [button, path] of buttonMap.entries()) {
        if (button.contains(target) || button === target) {
          console.log('[Navigation] Document handler triggered for path:', path);
          e.preventDefault();
          e.stopImmediatePropagation();
          // Clear any stale redirect paths
          sessionStorage.removeItem('404-redirect-path');
          // Use window.location.href for guaranteed navigation (preserves history)
          window.location.href = path;
          return;
        }
      }
    };
    
    // Use mousedown in capture phase - fires before click and before PayPal intercepts
    document.addEventListener('mousedown', documentHandler, true);
    
    return () => {
      document.removeEventListener('mousedown', documentHandler, true);
    };
  }, [isDonationPage]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-content mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            {isDonationPage ? (
              <button
                ref={logoRef}
                onClick={() => handleNavClick("/")}
                className="flex items-center cursor-pointer"
                type="button"
              >
                <img src={logo} alt="Alma Bridge of Hope" width={48} height={48} className="h-12 w-12 object-contain" />
              </button>
            ) : (
              <Link 
                to="/" 
                className="flex items-center"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <img src={logo} alt="Alma Bridge of Hope" width={48} height={48} className="h-12 w-12 object-contain" />
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isDonationPage ? (
              // On donation page, use explicit handlers to bypass PayPal interception
              <>
                <button
                  ref={homeRef}
                  onClick={() => handleNavClick("/")}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  type="button"
                >
                  {t("nav.home")}
                </button>
                <button
                  ref={projectsRef}
                  onClick={() => handleNavClick("/projects")}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  type="button"
                >
                  {t("nav.projects")}
                </button>
                <button
                  ref={newsRef}
                  onClick={() => handleNavClick("/news")}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  type="button"
                >
                  {t("nav.news")}
                </button>
                <button
                  ref={aboutRef}
                  onClick={() => handleNavClick("/about")}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  type="button"
                >
                  {t("nav.about")}
                </button>
                <button
                  ref={contactRef}
                  onClick={() => handleNavClick("/contact")}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  type="button"
                >
                  {t("nav.contact")}
                </button>
                <Link 
                  to="/donation" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <Button size="sm">
                    {t("nav.donate")}
                  </Button>
                </Link>
              </>
            ) : (
              // Normal navigation on other pages
              <>
                <Link 
                  to="/" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t("nav.home")}
                </Link>
                <Link 
                  to="/projects" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t("nav.projects")}
                </Link>
                <Link 
                  to="/news" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t("nav.news")}
                </Link>
                <Link 
                  to="/about" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t("nav.about")}
                </Link>
                <Link 
                  to="/contact" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t("nav.contact")}
                </Link>
                <Link 
                  to="/donation" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <Button size="sm">
                    {t("nav.donate")}
                  </Button>
                </Link>
              </>
            )}
            
            {/* Language Switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "de" : "en")}
              className="flex items-center gap-2"
            >
              <Globe size={16} />
              {language === "en" ? "DE" : "EN"}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            {isDonationPage ? (
              // On donation page, use explicit handlers to bypass PayPal interception
              <>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleNavClick("/");
                  }}
                  className="block text-muted-foreground hover:text-primary transition-colors w-full text-left cursor-pointer"
                  type="button"
                >
                  {t("nav.home")}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleNavClick("/projects");
                  }}
                  className="block text-muted-foreground hover:text-primary transition-colors w-full text-left cursor-pointer"
                  type="button"
                >
                  {t("nav.projects")}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleNavClick("/news");
                  }}
                  className="block text-muted-foreground hover:text-primary transition-colors w-full text-left cursor-pointer"
                  type="button"
                >
                  {t("nav.news")}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleNavClick("/about");
                  }}
                  className="block text-muted-foreground hover:text-primary transition-colors w-full text-left cursor-pointer"
                  type="button"
                >
                  {t("nav.about")}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleNavClick("/contact");
                  }}
                  className="block text-muted-foreground hover:text-primary transition-colors w-full text-left cursor-pointer"
                  type="button"
                >
                  {t("nav.contact")}
                </button>
                <Link 
                  to="/donation" 
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <Button size="sm" className="w-full">
                    {t("nav.donate")}
                  </Button>
                </Link>
              </>
            ) : (
              // Normal navigation on other pages
              <>
                <Link 
                  to="/" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {t("nav.home")}
                </Link>
                <Link 
                  to="/projects" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {t("nav.projects")}
                </Link>
                <Link 
                  to="/news" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {t("nav.news")}
                </Link>
                <Link 
                  to="/about" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {t("nav.about")}
                </Link>
                <Link 
                  to="/contact" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {t("nav.contact")}
                </Link>
                <Link 
                  to="/donation" 
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <Button size="sm" className="w-full">
                    {t("nav.donate")}
                  </Button>
                </Link>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "de" : "en")}
              className="flex items-center gap-2"
            >
              <Globe size={16} />
              {language === "en" ? "DE" : "EN"}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;