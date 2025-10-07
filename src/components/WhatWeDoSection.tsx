import { Card } from "@/components/ui/card";
import utilitiesImage from "@/assets/utilities-solar.jpg";
import educationImage from "@/assets/education-classroom.jpg";
import infrastructureImage from "@/assets/infrastructure-well.jpg";

const WhatWeDoSection = () => {
  const initiatives = [
    {
      title: "Basic Utilities",
      description: "Bringing clean water and renewable energy solutions to remote communities.",
      image: utilitiesImage,
    },
    {
      title: "Education & Training",
      description: "Supporting local education initiatives and skill-building programs.",
      image: educationImage,
    },
    {
      title: "Infrastructure & Local Empowerment",
      description: "Building sustainable infrastructure while empowering local leadership.",
      image: infrastructureImage,
    },
  ];

  return (
    <section id="work" className="py-section bg-background">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What We Do
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our work focuses on three key areas that create lasting impact in rural Uganda
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
      </div>
    </section>
  );
};

export default WhatWeDoSection;