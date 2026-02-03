import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Users, Droplets, Heart, GraduationCap } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import OptimizedImage from "@/components/OptimizedImage";
import community from "@/assets/community/community_3.webp";
import community1 from "@/assets/community/community.webp";
import community2 from "@/assets/community/community_2.webp";
import house from "@/assets/project/community_house/house_2.webp";
import communityHouse from "@/assets/project/community_house/construction_house.webp";
import children from "@/assets/community/children.webp";
import community4 from "@/assets/community/community_4.webp";
import community5 from "@/assets/community/community_5.webp";
import community6 from "@/assets/community/community_6.webp";

const CommunitySection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="community" className="pt-section pb-section bg-muted/30">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("community.title")}
          </h2>
        </div>

        {/* Community Images Carousel - Full Width */}
        <div className="mb-16 -mx-6">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              <CarouselItem className="pl-2 md:pl-4 basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <div className="flex flex-col">
                      <OptimizedImage
                        src={community}
                        alt="Peter, Gründer von Alma Bridge of Hope Uganda, mit Kindern aus Namaliri"
                        aspectRatio="4/3"
                        className="w-full h-full object-cover"
                        lazy={true}
                      />
                      <div className="mt-2 px-2 pb-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                        Peter, Gründer von Alma Bridge of Hope Uganda, mit Kindern aus Namaliri
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <div className="flex flex-col">
                      <OptimizedImage
                        src={community1}
                        alt="Einblick in Namaliri"
                        aspectRatio="4/3"
                        className="w-full h-full object-cover object-top"
                        lazy={true}
                      />
                      <div className="mt-2 px-2 pb-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Einblick in Namaliri
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <div className="flex flex-col">
                      <OptimizedImage
                        src={community2}
                        alt="Aaron, Gründer von Alma Bridge of Hope Germany, bei seinem Besuch in Uganda"
                        aspectRatio="4/3"
                        className="w-full h-full object-cover"
                        lazy={true}
                      />
                      <div className="mt-2 px-2 pb-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Aaron, Gründer von Alma Bridge of Hope Germany, bei seinem Besuch in Uganda
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <div className="flex flex-col">
                      <OptimizedImage
                        src={community5}
                        alt="Einblick in Namaliri"
                        aspectRatio="4/3"
                        className="w-full h-full object-cover"
                        lazy={true}
                      />
                      <div className="mt-2 px-2 pb-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Einblick in Namaliri
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <div className="flex flex-col">
                      <OptimizedImage
                        src={communityHouse}
                        alt="Gemeindehaus im Bau: Das zentrale Gebäude für Gemeinschaftsaktivitäten und Veranstaltungen"
                        aspectRatio="4/3"
                        className="w-full h-full object-cover"
                        lazy={true}
                      />
                      <div className="mt-2 px-2 pb-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Gemeindehaus im Bau
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <div className="flex flex-col">
                      <OptimizedImage
                        src={children}
                        alt="Kinder aus Namaliri"
                        aspectRatio="4/3"
                        className="w-full h-full object-cover"
                        lazy={true}
                      />
                      <div className="mt-2 px-2 pb-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Kinder aus Namaliri
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <div className="flex flex-col">
                      <OptimizedImage
                        src={house}
                        alt="Rohbau des Gemeindehauses"
                        aspectRatio="4/3"
                        className="w-full h-full object-cover object-top"
                        lazy={true}
                      />
                      <div className="mt-2 px-2 pb-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Rohbau des Gemeindehauses
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Community Information */}
          <div className="space-y-6 lg:col-span-3">
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>{t("community.description1")}</p>
              <p>{t("community.description2")}</p>
              <p>{t("community.description3")}</p>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              <Card className="p-6 text-center bg-primary-light/30 break-words">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-primary mb-1">15.000</div>
                <div className="text-sm text-muted-foreground">{t("community.stats.people")}</div>
              </Card>
              <Card className="p-6 text-center bg-primary-light/30 break-words">
                <Droplets className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-primary mb-1">2 km</div>
                <div className="text-sm text-muted-foreground">{t("community.stats.water_source")}</div>
              </Card>
              <Card className="p-6 text-center bg-primary-light/30 break-words">
                <GraduationCap className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-primary mb-1">25%</div>
                <div className="text-sm text-muted-foreground">{t("community.stats.education")}</div>
              </Card>
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-6">
              {/* First Map */}
              {/* <Card className="overflow-hidden shadow-card">
                <div className="aspect-[4/3] bg-muted relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7!2d32.827667236328125!3d0.6293768286705017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMzcnNDkuOCJOIDMywrA0OSc0MC4wIkU!5e0!3m2!1sen!2sde!4v1234567890124!5m2!1sen!2sde"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Community Location"
                    className="w-full h-full"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("community.location.title")}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    0.6293768286705017, 32.827667236328125
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("community.location.region")}
                  </p>
                </div>
              </Card> */}

              {/* Second Map */}
              <Card className="overflow-hidden shadow-card">
                <div className="aspect-[4/3] bg-muted relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7!2d32.80263137817383!3d0.6462867856025696!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMzgnNDYuNiJOIDMywrA0OCcwOS41IkU!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Community Center Location"
                    className="w-full h-full"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("community.location.title_2")}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    0.6462867856025696, 32.80263137817383
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("community.location.region")}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
