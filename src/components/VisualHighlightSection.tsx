import landscapeImage from "@/assets/uganda-landscape.jpg";

const VisualHighlightSection = () => {
  return (
    <section className="relative h-96 md:h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${landscapeImage})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl px-6">
        <h2 className="text-2xl md:text-4xl font-bold leading-tight">
          We believe community-led development starts with infrastructure
        </h2>
      </div>
    </section>
  );
};

export default VisualHighlightSection;