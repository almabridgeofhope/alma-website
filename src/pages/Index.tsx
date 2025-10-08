import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import MissionSection from "@/components/MissionSection";
import WhatWeDoSection from "@/components/WhatWeDoSection";
import CommunitySection from "@/components/CommunitySection";
import TeamSection from "@/components/TeamSection";
import VisualHighlightSection from "@/components/VisualHighlightSection";

import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <MissionSection />
        <WhatWeDoSection />
        <CommunitySection />
        <TeamSection />
        <VisualHighlightSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
