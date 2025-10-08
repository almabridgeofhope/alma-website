import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, MapPin, Instagram, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/uganda-landscape.jpg";
import emailjs from '@emailjs/browser';

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: t("contact.error.title"),
        description: t("contact.error.required"),
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: t("contact.error.title"),
        description: t("contact.error.email"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // EmailJS configuration
      const serviceId = 'service_zdc12l3'; // Your EmailJS service ID
      const templateId = 'template_eqc74jo'; // Your EmailJS template ID
      const publicKey = 'zxPupF44hCueD6u4K'; // Replace with your actual EmailJS public key

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject || 'Contact Form Message',
        message: formData.message,
        to_email: 'info@almabridgeofhope.org',
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      toast({
        title: t("contact.success.title"),
        description: t("contact.success.description"),
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error('EmailJS error:', error);
      
      // More detailed error handling
      let errorMessage = t("contact.error.send");
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('Invalid email')) {
          errorMessage = "Invalid email configuration";
        } else if (error.message.includes('Template not found')) {
          errorMessage = "Email template not found";
        } else if (error.message.includes('Service not found')) {
          errorMessage = "Email service not configured";
        }
      }
      
      toast({
        title: t("contact.error.title"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
        {/* Hero Section with Background Image */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          
          <div className="relative z-10 text-center text-white max-w-4xl px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("contact.hero.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t("contact.hero.subtitle")}
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
                  {t("contact.form.title")}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">{t("contact.form.name")}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t("contact.form.name_placeholder")}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">{t("contact.form.email")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t("contact.form.email_placeholder")}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">{t("contact.form.subject")}</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t("contact.form.subject_placeholder")}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">{t("contact.form.message")}</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t("contact.form.message_placeholder")}
                      required
                      className="mt-2 min-h-[150px]"
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("contact.form.sending")}
                      </>
                    ) : (
                      t("contact.form.submit")
                    )}
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
                        {t("contact.info.email")}
                      </h3>
                      <a 
                        href="mailto:info@almabridgeofhope.org"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@almabridgeofhope.org
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
                        {t("contact.info.address")}
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
                        {t("contact.info.social")}
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
                    <strong className="text-foreground">{t("contact.note.title")}</strong> {t("contact.note.text")}
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
