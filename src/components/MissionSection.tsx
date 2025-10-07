const MissionSection = () => {
  return (
    <section id="about" className="py-section bg-muted">
      <div className="max-w-content mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Our Mission
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Alma Bridge of Hope stands as a testament to the power of international collaboration. 
              Our German-Ugandan partnership focuses on empowering underserved communities in rural 
              Uganda through sustainable development initiatives.
            </p>
            
            <p>
              We believe that access to basic utilities like clean water and electricity, combined 
              with quality education, creates the foundation for thriving communities. Our approach 
              is community-led, ensuring that every project serves the real needs of the people we work with.
            </p>
            
            <p>
              Through practical, local development projects, we're not just building infrastructure 
              – we're building bridges of hope that connect communities across continents and create 
              lasting positive change.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;