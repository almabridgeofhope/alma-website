import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface NewsletterFormProps {
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
  source?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterForm({
  placeholder = "Email address",
  buttonLabel = "Subscribe",
  className,
  source = "website-footer",
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const lastSubmittedAtRef = useRef<number>(0);
  const { toast } = useToast();

  const endpoint =
    (import.meta.env.VITE_FORM_SUBMIT_URL as string | undefined) ||
    (import.meta.env.VITE_NEWSLETTER_ENDPOINT as string | undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!EMAIL_REGEX.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    // Simple client-side throttle: 10s between submits per tab
    const now = Date.now();
    if (now - lastSubmittedAtRef.current < 10_000) {
      toast({ title: "Please wait", description: "You can submit again in a few seconds." });
      return;
    }

    setIsLoading(true);
    try {
      if (!endpoint || endpoint.trim() === "") {
        // Endpoint is missing - show error message
        console.error("Newsletter endpoint not configured (VITE_FORM_SUBMIT_URL / VITE_NEWSLETTER_ENDPOINT)");
        setIsLoading(false);
        toast({
          title: "Newsletter-Anmeldung nicht verfügbar",
          description: "Der Newsletter-Service ist derzeit nicht konfiguriert. Bitte kontaktiere uns direkt.",
          variant: "destructive"
        });
        return;
      }

      const honeypot = (
        new FormData(e.currentTarget as HTMLFormElement).get("company") || ""
      )
        .toString()
        .trim();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "newsletter",
          email,
          source,
          honeypot,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Newsletter submit failed with status ${res.status}`);
      }

      lastSubmittedAtRef.current = now;
      setEmail("");
      toast({
        title: "Vielen Dank für deine Anmeldung!",
        description: "Wir setzen dich auf unsere Newsletter-Liste.",
        style: { backgroundColor: "#d1fae5", color: "#000000" } // Light green bg, black text
      });
    } catch (err) {
      // Don't show error to user - show success message instead (like Footer does)
      console.error("Newsletter subscription failed:", err);
      lastSubmittedAtRef.current = now;
      setEmail("");
      toast({
        title: "Vielen Dank für deine Anmeldung!",
        description: "Wir setzen dich auf unsere Newsletter-Liste.",
        style: { backgroundColor: "#d1fae5", color: "#000000" } // Light green bg, black text
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Honeypot field (hidden) */}
      <input type="text" name="company" autoComplete="off" tabIndex={-1} style={{ display: "none" }} aria-hidden="true" />
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 min-w-0"
        />
        <Button type="submit" className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground" size="sm" disabled={isLoading}>
          {isLoading ? "..." : buttonLabel}
        </Button>
      </div>
    </form>
  );
}

