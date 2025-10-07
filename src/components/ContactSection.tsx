import { Button } from "@/components/ui/button";
import { Mail, Globe } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-section bg-background">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Get In Touch
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-8">
            <p className="text-lg text-muted-foreground">
              We'd love to hear from you. Reach out to learn more about our work 
              or explore potential partnerships.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
                asChild
              >
                <a href="mailto:contact@almabridge.org" className="flex items-center gap-2">
                  <Mail size={20} />
                  contact@almabridge.org
                </a>
              </Button>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe size={20} />
                <span>Follow us on Facebook (coming soon)</span>
              </div>
            </div>

            <div className="pt-8 border-t border-border">
              <p className="text-muted-foreground">
                Currently, we're focused on establishing our projects. Donation and volunteering 
                opportunities will be available soon. Thank you for your patience and interest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;