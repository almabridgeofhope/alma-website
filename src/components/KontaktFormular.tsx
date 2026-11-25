import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import emailjs from "@emailjs/browser";
import RecaptchaFeld from "@/components/RecaptchaFeld";
import {
  baueTemplateParams,
  fehlendeKontaktVariablen,
  istHoneypotBefuellt,
} from "@/lib/kontaktformular";

// Statisch gelesen (Vite ersetzt sie beim Build). Fehlt ein Wert (EmailJS oder reCAPTCHA-Site-Key), bricht schon der Build ab,
// siehe vite.config.ts; die Prüfung beim Absenden ist nur ein zweites Netz.
const KONTAKT_ENV = {
  VITE_EMAILJS_SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  VITE_EMAILJS_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  VITE_EMAILJS_PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  VITE_RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
};

const KontaktFormular = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  // Honigtopf: für Menschen unsichtbar und nicht erreichbar, Bots füllen ihn aus.
  const [honeypot, setHoneypot] = useState("");
  // Token des gelösten reCAPTCHA; gilt nur einmal, nach jedem Versuch wird das Feld zurückgesetzt.
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaReset, setRecaptchaReset] = useState(0);
  const [spamschutzFehler, setSpamschutzFehler] = useState("");

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

    // Honigtopf befüllt: Bot. Stiller "Erfolg", es wird nichts gesendet.
    if (istHoneypotBefuellt(honeypot)) {
      toast({
        title: t("contact.success.title"),
        description: t("contact.success.description"),
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setHoneypot("");
      return;
    }

    if (fehlendeKontaktVariablen(KONTAKT_ENV).length > 0) {
      console.error("Kontaktformular-Konfiguration fehlt (VITE_EMAILJS_*, VITE_RECAPTCHA_SITE_KEY)");
      toast({
        title: t("contact.error.title"),
        description: t("contact.error.send"),
        variant: "destructive",
      });
      return;
    }

    // Ohne gelöstes reCAPTCHA wird nichts gesendet. Die Prüfung des Tokens selbst macht EmailJS,
    // wenn im Template reCAPTCHA aktiviert und der Secret Key hinterlegt ist; das ist von hier nicht prüfbar.
    if (!recaptchaToken) {
      const meldung = t("contact.recaptcha.required");
      setSpamschutzFehler(meldung);
      toast({
        title: t("contact.error.title"),
        description: meldung,
        variant: "destructive",
      });
      return;
    }
    setSpamschutzFehler("");

    setIsLoading(true);

    try {
      await emailjs.send(
        KONTAKT_ENV.VITE_EMAILJS_SERVICE_ID,
        KONTAKT_ENV.VITE_EMAILJS_TEMPLATE_ID,
        baueTemplateParams(formData, recaptchaToken),
        KONTAKT_ENV.VITE_EMAILJS_PUBLIC_KEY,
      );

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
      // Ein Token gilt nur für einen Versand.
      setRecaptchaToken(null);
      setRecaptchaReset((n) => n + 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honigtopf: außerhalb des Bildschirms, nicht fokussierbar, für Screenreader ausgeblendet */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <input
          id="kontakt-zusatzfeld"
          name="kontakt-zusatzfeld"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

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

      <RecaptchaFeld
        siteKey={KONTAKT_ENV.VITE_RECAPTCHA_SITE_KEY ?? ""}
        onToken={(token) => {
          setRecaptchaToken(token);
          if (token) setSpamschutzFehler("");
        }}
        resetKey={recaptchaReset}
        fehler={spamschutzFehler}
      />

      <Button 
        type="submit"
        disabled={isLoading}
        size="lg"
        className="w-full"
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
  );
};

export default KontaktFormular;
