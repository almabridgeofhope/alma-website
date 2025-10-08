import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import utilitiesImage from "@/assets/water.webp";
import educationImage from "@/assets/education.webp";
import infrastructureImage from "@/assets/community_house.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const WhatWeDoSection = () => {
  const { t } = useLanguage();
  
  const initiatives = [
    {
      title: t("whatwedo.utilities.title"),
      description: t("whatwedo.utilities.desc"),
      image: utilitiesImage,
    },
    {
      title: t("whatwedo.infrastructure.title"),
      description: t("whatwedo.infrastructure.desc"),
      image: infrastructureImage,
    },
    {
      title: t("whatwedo.education.title"),
      description: t("whatwedo.education.desc"),
      image: educationImage,
    },
  ];

  return (
    <section id="work" className="py-section bg-background">
      <div className="max-w-content mx-auto px-6">
      <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("whatwedo.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("whatwedo.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {initiatives.map((initiative, index) => (
            <Card key={index} className="overflow-hidden shadow-card hover:shadow-soft transition-shadow duration-300">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={initiative.image} 
                  alt={initiative.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {initiative.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {initiative.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link to="/projects">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
            >
              {t("whatwedo.button")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WhatWeDoSection;