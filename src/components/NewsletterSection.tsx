import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !consent) {
      toast({
        title: "Please complete the form",
        description: "Email address and consent are required.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Thank you for subscribing!",
      description: "You'll receive monthly updates from our team in Uganda.",
    });
    
    setEmail("");
    setConsent(false);
  };

  return (
    <section id="updates" className="py-section bg-secondary-light">
      <div className="max-w-content mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 shadow-card">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Stay Connected
              </h2>
              <p className="text-lg text-muted-foreground">
                Receive monthly updates from the field – real stories, real progress.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked as boolean)}
                />
                <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed">
                  I consent to receiving monthly updates from Alma Bridge of Hope about community 
                  development projects in Uganda. I can unsubscribe at any time.
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
                disabled={!email || !consent}
              >
                Subscribe to Updates
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Latest Update:</strong> Solar Installation Complete in Kamuli Village - 
                200 families now have access to clean electricity.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;