import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { istRecaptchaBereit, ladeRecaptcha, type Grecaptcha } from "@/lib/recaptcha";

// Breite des Standard-Widgets; schmaler (kleines Handy) nimmt Google die kompakte Form.
const STANDARD_BREITE = 304;

interface RecaptchaFeldProps {
  siteKey: string;
  /** Token nach gelöstem Rätsel, null wenn es abläuft, fehlschlägt oder zurückgesetzt wird. */
  onToken: (token: string | null) => void;
  /** Jede Änderung setzt das Widget zurück (ein Token gilt nur einmal). */
  resetKey: number;
  /** Fehlermeldung des Formulars zum Spamschutz, wird am Feld angezeigt. */
  fehler?: string;
}

type Zustand = "einwilligung" | "laedt" | "bereit" | "fehler";

function istSchmal(platz: HTMLElement): boolean {
  return platz.clientWidth > 0 && platz.clientWidth < STANDARD_BREITE;
}

/**
 * Zeigt zuerst nur einen Hinweis mit Link zur Datenschutzerklärung und einen Knopf. Erst der
 * Klick lädt das Skript von Google; vorher fließt keine Anfrage an Google.
 */
const RecaptchaFeld = ({ siteKey, onToken, resetKey, fehler }: RecaptchaFeldProps) => {
  const { t, language } = useLanguage();
  const [zustand, setZustand] = useState<Zustand>("einwilligung");
  const [widgetFehler, setWidgetFehler] = useState(false);
  const behaelter = useRef<HTMLDivElement>(null);
  const grecaptcha = useRef<Grecaptcha | null>(null);
  const widgetId = useRef<number | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const laden = () => {
    setZustand("laedt");
    ladeRecaptcha(language)
      .then((g) => {
        grecaptcha.current = g;
        setZustand("bereit");
      })
      .catch((error) => {
        console.error("reCAPTCHA:", error);
        setZustand("fehler");
      });
  };

  // Kommt die Besucherin zurück auf die Seite, nachdem sie schon eingewilligt hat (das Skript
  // bleibt im SPA geladen), entsteht das Widget ohne zweiten Klick.
  useEffect(() => {
    if (istRecaptchaBereit()) laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Das Widget wird gezeichnet, sobald der Behälter im DOM steht (Zustand "bereit").
  useEffect(() => {
    const g = grecaptcha.current;
    const platz = behaelter.current;
    if (zustand !== "bereit" || !g || !platz || widgetId.current !== null) return;
        widgetId.current = g.render(platz, {
      sitekey: siteKey,
      size: istSchmal(platz) ? "compact" : "normal",
      callback: (token) => {
        setWidgetFehler(false);
        onTokenRef.current(token);
      },
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => {
        onTokenRef.current(null);
        setWidgetFehler(true);
      },
    });
  }, [zustand, siteKey]);

  useEffect(() => {
    if (widgetId.current === null) return;
    grecaptcha.current?.reset(widgetId.current);
    onTokenRef.current(null);
  }, [resetKey]);

  return (
    <div role="group" aria-labelledby="spamschutz-titel" className="space-y-3 min-w-0">
      <p id="spamschutz-titel" className="text-sm font-medium text-foreground">
        {t("contact.recaptcha.title")}
      </p>

      {zustand !== "bereit" && (
        <div className="rounded-md border border-border bg-muted/40 p-4 space-y-3">
          <p className="text-sm text-muted-foreground" id="spamschutz-hinweis">
            {t("contact.recaptcha.notice")}{" "}
            <Link to="/privacy" className="text-primary hover:underline" target="_blank">
              {t("contact.recaptcha.privacyLink")}
            </Link>
            . {t("contact.recaptcha.alternative")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={laden}
            disabled={zustand === "laedt" || siteKey === ""}
            aria-describedby="spamschutz-hinweis"
            className="w-full sm:w-auto h-auto whitespace-normal py-2"
          >
            {zustand === "laedt" ? t("contact.recaptcha.loading") : t("contact.recaptcha.load")}
          </Button>
        </div>
      )}

      {siteKey === "" && (
        <p role="alert" className="text-sm text-destructive">
          {t("contact.recaptcha.notConfigured")}
        </p>
      )}

      {zustand === "fehler" && (
        <p role="alert" className="text-sm text-destructive">
          {t("contact.recaptcha.loadError")}
        </p>
      )}

      {/* Das Widget ist 304 px breit; im Notfall scrollt nur dieser Streifen, nie die Seite. */}
      <div ref={behaelter} className={zustand === "bereit" ? "max-w-full overflow-x-auto" : "hidden"} />

      {widgetFehler && (
        <p role="alert" className="text-sm text-destructive">
          {t("contact.recaptcha.widgetError")}
        </p>
      )}

      {fehler && (
        <p role="alert" className="text-sm text-destructive">
          {fehler}
        </p>
      )}
    </div>
  );
};

export default RecaptchaFeld;
