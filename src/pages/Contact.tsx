import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, MapPin, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically send the form data to a backend
    toast({
      title: "Nachricht gesendet",
      description: "Vielen Dank für Ihre Nachricht. Wir melden uns bald bei Ihnen!",
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-section bg-primary-light">
          <div className="max-w-content mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-center">
              Kontakt
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-center leading-relaxed">
              Hast du Fragen oder möchtest du unsere Arbeit unterstützen? Wir freuen uns über jede Nachricht!
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card className="p-8 shadow-card">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Nachricht senden
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ihr Name"
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="ihre.email@beispiel.de"
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Betreff</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Worum geht es?"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Nachricht *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Ihre Nachricht..."
                      required
                      className="mt-2 min-h-[150px]"
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button w-full"
                  >
                    Nachricht senden
                  </Button>
                </form>
              </Card>

              {/* Contact Information */}
              <div className="space-y-8">
                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        E-Mail
                      </h3>
                      <a 
                        href="mailto:info@alma-bridge.org"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@alma-bridge.org
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Adresse
                      </h3>
                      <p className="text-muted-foreground">
                        Alma Bridge of Hope e. V.<br />
                        Darmstädter Straße 97<br />
                        70376 Stuttgart<br />
                        Deutschland
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Instagram className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Social Media
                      </h3>
                      <a 
                        href="https://instagram.com/almabridgeofhope"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        @almabridgeofhope
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-card bg-primary-light border-primary/20">
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Hinweis:</strong> Wir befinden uns derzeit in der Aufbauphase. 
                    Spenden- und Freiwilligenmöglichkeiten werden in Kürze verfügbar sein. 
                    Vielen Dank für Ihr Interesse und Ihre Geduld!
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
