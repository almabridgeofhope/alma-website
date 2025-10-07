import { Card } from "@/components/ui/card";
import member1 from "@/assets/team-member-1.jpg";
import member2 from "@/assets/team-member-2.jpg";
import member3 from "@/assets/team-member-3.jpg";

const TeamSection = () => {
  const teamMembers = [
    {
      name: "Amara Nakato",
      role: "Uganda Operations Director",
      image: member1,
      quote: "Every well we dig, every solar panel we install, brings hope to our community.",
    },
    {
      name: "Marcus Weber",
      role: "Germany Partnership Coordinator", 
      image: member2,
      quote: "Building bridges between cultures through sustainable development.",
    },
    {
      name: "Samuel Okello",
      role: "Community Engagement Lead",
      image: member3,
      quote: "True change comes from within the community, we just facilitate the journey.",
    },
  ];

  return (
    <section id="team" className="py-section bg-primary-light">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our international team brings together diverse perspectives united by a common vision
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <Card key={index} className="text-center overflow-hidden shadow-card hover:shadow-soft transition-shadow duration-300">
              <div className="aspect-square overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-primary font-medium mb-4">
                  {member.role}
                </p>
                <blockquote className="text-muted-foreground italic leading-relaxed">
                  "{member.quote}"
                </blockquote>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;