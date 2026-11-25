// Google reCAPTCHA v2 (Checkbox) für das Kontaktformular. Das Skript von Google wird nie beim
// Seitenaufruf geladen, sondern erst, wenn die Besucherin es ausdrücklich verlangt
// (src/components/RecaptchaFeld.tsx). EmailJS prüft den Token serverseitig mit dem Secret Key,
// der im EmailJS-Template hinterlegt ist; im Browser gibt es nur den öffentlichen Site-Key.

const SKRIPT_BASIS = "https://www.google.com/recaptcha/api.js";
const SKRIPT_ID = "google-recaptcha-skript";
// Lädt api.js, blockiert aber ein Blocker die Folgedatei von gstatic, meldet `ready` nie zurück.
const BEREIT_TIMEOUT_MS = 10_000;

export interface RecaptchaRenderParams {
  sitekey: string;
  size?: "normal" | "compact";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
}

export interface Grecaptcha {
  ready: (callback: () => void) => void;
  render: (container: HTMLElement, params: RecaptchaRenderParams) => number;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

/** Adresse des Google-Skripts; explizites Rendern, damit nichts von selbst startet. */
export function recaptchaSkriptUrl(sprache: string): string {
  return `${SKRIPT_BASIS}?render=explicit&hl=${encodeURIComponent(sprache)}`;
}

/** Gibt es schon ein Skript-Element von uns, also hat die Besucherin eingewilligt? */
export function istRecaptchaSkriptGeladen(doc: Document = document): boolean {
  return doc.getElementById(SKRIPT_ID) !== null;
}

let laufendesLaden: Promise<Grecaptcha> | null = null;

/**
 * Lädt das Skript (einmal) und liefert das Objekt `grecaptcha`, sobald es bereit ist.
 * Nur nach ausdrücklicher Einwilligung aufrufen. Ein Fehler (Netz, Blocker) wird abgelehnt
 * und nicht verschluckt; ein neuer Versuch lädt das Skript neu.
 */
export function ladeRecaptcha(sprache: string, doc: Document = document): Promise<Grecaptcha> {
  if (laufendesLaden) return laufendesLaden;
  laufendesLaden = new Promise<Grecaptcha>((resolve, reject) => {
    const bereit = () => {
      const g = window.grecaptcha;
      if (!g) return reject(new Error("reCAPTCHA nicht verfügbar"));
      const timer = setTimeout(
        () => reject(new Error("reCAPTCHA nicht bereit (Zeitüberschreitung)")),
        BEREIT_TIMEOUT_MS,
      );
      g.ready(() => {
        clearTimeout(timer);
        resolve(g);
      });
    };
    const vorhanden = doc.getElementById(SKRIPT_ID);
    if (vorhanden && window.grecaptcha) return bereit();
    vorhanden?.remove();
    const skript = doc.createElement("script");
    skript.id = SKRIPT_ID;
    skript.src = recaptchaSkriptUrl(sprache);
    skript.async = true;
    skript.onload = bereit;
    skript.onerror = () => {
      skript.remove();
      reject(new Error("reCAPTCHA-Skript konnte nicht geladen werden"));
    };
    doc.head.appendChild(skript);
  });
  laufendesLaden.catch(() => {
    laufendesLaden = null;
    doc.getElementById(SKRIPT_ID)?.remove();
  });
  return laufendesLaden;
}

/** Ist das Skript schon geladen und einsatzbereit (Einwilligung früher im Besuch gegeben)? */
export function istRecaptchaBereit(): boolean {
  return istRecaptchaSkriptGeladen() && window.grecaptcha !== undefined;
}

/** Nur für Tests: vergisst den Ladezustand. */
export function vergesseRecaptchaLadezustand(): void {
  laufendesLaden = null;
}
