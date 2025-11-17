import heroImage from "@/assets/nature/land_3.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import PreloadImage from "@/components/PreloadImage";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const { t } = useLanguage();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Preload kritisches Hero-Bild */}
      <PreloadImage src={heroImage} />
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl px-6">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          {t("hero.title")}
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
          {t("hero.subtitle")}
        </p>
        <Link 
          to="/donation" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-block"
        >
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t("hero.donateButton")}
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;