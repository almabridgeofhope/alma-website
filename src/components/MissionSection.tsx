import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import land from "@/assets/nature/land.png";
import water from "@/assets/project/water.png";
import education from "@/assets/project/education.png";
import goatFarm from "@/assets/project/goat_farm.webp";

const MissionSection = () => {
  const { t } = useLanguage();
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000); // Auto-rotate every 4 seconds

    return () => clearInterval(interval);
  }, [api]);
  
  return (
    <section id="about" className="py-section bg-muted">
      <div className="max-w-content mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-12 items-center">
          {/* Auto-rotating Carousel - Overlapping Phone Size (1/3) */}
          <div className="relative flex justify-center lg:justify-start lg:col-span-1">
            <div className="relative w-64 h-96">
              {/* Background images for overlap effect */}
              <div className="absolute inset-0">
                <div className="absolute left-2 w-full h-full">
                  <Card className="overflow-hidden h-full opacity-30">
                    <div className="relative h-full">
                      <img
                        src={water}
                        alt="Water projects"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Card>
                </div>
                <div className="absolute left-1 w-full h-full">
                  <Card className="overflow-hidden h-full opacity-50">
                    <div className="relative h-full">
                      <img
                        src={education}
                        alt="Education programs"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Card>
                </div>
              </div>
              
              {/* Main carousel */}
              <Carousel
                setApi={setApi}
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full h-full relative z-10"
              >
                <CarouselContent className="-ml-0">
                  <CarouselItem className="pl-0">
                    <Card className="overflow-hidden h-96 shadow-lg">
                      <img
                        src={land}
                        alt="Land and agriculture"
                        className="w-full h-full object-cover"
                      />
                    </Card>
                  </CarouselItem>
                  <CarouselItem className="pl-0">
                    <Card className="overflow-hidden h-96 shadow-lg">
                      <img
                        src={water}
                        alt="Water projects"
                        className="w-full h-full object-cover"
                      />
                    </Card>
                  </CarouselItem>
                  <CarouselItem className="pl-0">
                    <Card className="overflow-hidden h-96 shadow-lg">
                      <img
                        src={education}
                        alt="Education programs"
                        className="w-full h-full object-cover"
                      />
                    </Card>
                  </CarouselItem>
                  <CarouselItem className="pl-0">
                    <Card className="overflow-hidden h-96 shadow-lg">
                      <img
                        src={goatFarm}
                        alt="Goat farm project"
                        className="w-full h-full object-cover"
                      />
                    </Card>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
              
              {/* Carousel Indicators */}
              <div className="flex justify-center mt-4 space-x-2 relative z-20">
                {Array.from({ length: count }).map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === current - 1 ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                    onClick={() => api?.scrollTo(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mission Text (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("mission.title")}
            </h2>
            
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>{t("mission.p1")}</p>
              <p>{t("mission.p2")}</p>
              <p>{t("mission.p3")}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/contact"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
                >
                  {t("mission.contact")}
                </Button>
              </Link>
              <Link 
                to="/projects"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <Button 
                  size="lg" 
                  variant="outline"
                  className="shadow-button"
                >
                  {t("mission.donate")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;