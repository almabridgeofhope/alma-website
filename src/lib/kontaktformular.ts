// Reine Hilfen für das Kontaktformular (src/pages/Contact.tsx). Bewusst ohne
// import.meta.env, damit vite.config.ts und die Tests sie ohne Vite-Laufzeit laden können.

/** Die drei EmailJS-Werte, die der Build aus der Umgebung braucht (siehe .env.example). */
export const EMAILJS_VARIABLEN = [
  "VITE_EMAILJS_SERVICE_ID",
  "VITE_EMAILJS_TEMPLATE_ID",
  "VITE_EMAILJS_PUBLIC_KEY",
] as const;

const STANDARD_BETREFF = "Contact Form Message";

export interface KontaktEingabe {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Leer, nur Leerzeichen oder mit Leerzeichen/Zeilenumbruch am Rand (typischer Fehler beim
// Einfügen in GitHub): EmailJS lehnt solche Werte ab, der Build soll es vorher melden.
function istLeerOderUnsauber(wert: string | undefined): boolean {
  return wert === undefined || wert.trim() === "" || wert !== wert.trim();
}

/** Namen der EmailJS-Variablen, die fehlen, leer sind oder Leerraum am Rand haben. Leere Liste = alles da. */
export function fehlendeEmailjsVariablen(
  env: Record<string, string | undefined>,
): string[] {
  return EMAILJS_VARIABLEN.filter((name) => istLeerOderUnsauber(env[name]));
}

/**
 * Felder des EmailJS-Templates. Der Empfänger steht bewusst nicht darin: er ist im
 * Template im EmailJS-Dashboard fest hinterlegt, der Browser kann ihn nicht ändern.
 */
export function baueTemplateParams(eingabe: KontaktEingabe) {
  return {
    from_name: eingabe.name,
    from_email: eingabe.email,
    subject: eingabe.subject || STANDARD_BETREFF,
    message: eingabe.message,
    reply_to: eingabe.email,
  };
}

/** Das Honigtopf-Feld ist für Menschen unsichtbar; jeder Inhalt stammt von einem Bot. */
export function istHoneypotBefuellt(wert: string): boolean {
  return wert !== "";
}
