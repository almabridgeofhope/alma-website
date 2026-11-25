import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ladeRecaptcha, type Grecaptcha } from "@/lib/recaptcha";

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

type Zustand = "laedt" | "bereit" | "fehler";

function istSchmal(platz: HTMLElement): boolean {
  return platz.clientWidth > 0 && platz.clientWidth < STANDARD_BREITE;
}

/**
 * Lädt das Skript von Google, sobald das Feld erscheint (nur auf der Kontaktseite). Bei einem
 * Ladefehler gibt es einen Knopf für den nächsten Versuch.
 */
const RecaptchaFeld = ({ siteKey, onToken, resetKey, fehler }: RecaptchaFeldProps) => {
  const { t, language } = useLanguage();
  const [zustand, setZustand] = useState<Zustand>("laedt");
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

  // Ohne Site-Key gibt es nichts zu laden; das Feld sagt es unten sichtbar.
  useEffect(() => {
    if (siteKey !== "") laden();
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

      {zustand === "laedt" && siteKey !== "" && (
        <p className="text-sm text-muted-foreground" role="status">
          {t("contact.recaptcha.loading")}
        </p>
      )}

      {siteKey === "" && (
        <p role="alert" className="text-sm text-destructive">
          {t("contact.recaptcha.notConfigured")}
        </p>
      )}

      {zustand === "fehler" && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">
            {t("contact.recaptcha.loadError")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={laden}
            className="h-auto whitespace-normal py-2"
          >
            {t("contact.recaptcha.load")}
          </Button>
        </div>
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
