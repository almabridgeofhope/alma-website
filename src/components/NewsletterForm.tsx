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

  const endpoint = import.meta.env.VITE_NEWSLETTER_ENDPOINT as string | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!endpoint) {
      toast({ title: "Newsletter endpoint missing", description: "Please configure VITE_NEWSLETTER_ENDPOINT.", variant: "destructive" });
      return;
    }

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
      // Use a simple form submission approach that bypasses CORS
      const formData = new FormData();
      formData.append('email', email);
      formData.append('source', source);

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData, // Use FormData instead of JSON
        mode: 'no-cors', // Disable CORS checking
      });

      // With no-cors mode, we can't read the response, so assume success
      lastSubmittedAtRef.current = now;
      setEmail("");
      toast({
        title: "Vielen Dank für deine Anmeldung!",
        description: "Wir setzen dich auf unsere Newsletter-Liste.",
        style: { backgroundColor: "#d1fae5", color: "#000000" } // Light green bg, black text
      });
    } catch (err: any) {
      toast({ title: "Submission failed", description: String(err?.message || err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Honeypot field (hidden) */}
      <input type="text" name="company" autoComplete="off" tabIndex={-1} style={{ display: "none" }} aria-hidden="true" />
      <div className="space-y-3">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="sm" disabled={isLoading}>
          {isLoading ? "Wird gesendet..." : buttonLabel}
        </Button>
      </div>
    </form>
  );
}



