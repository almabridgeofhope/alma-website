import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { translations } from "./translations";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PRIVACY_PAGE = readFileSync(join(REPO, "src/pages/Privacy.tsx"), "utf-8");

function privacyKeys(lang: "en" | "de"): string[] {
  return Object.keys(translations[lang]).filter(
    (key) => key.startsWith("privacy.") || key.startsWith("cookieBanner."),
  );
}

function keysUsedByPage(): string[] {
  return [...PRIVACY_PAGE.matchAll(/t\("([^"]+)"\)/g)].map((match) => match[1]);
}

// Host-Endung -> Begriff, der in der Datenschutzerklärung stehen muss. Ein neuer Host im Code
// ohne Eintrag hier lässt den Test rot werden: dann Abschnitt in Privacy.tsx schreiben.
const ANBIETER: Record<string, string[]> = {
  "googletagmanager.com": ["Google Analytics"],
  "fonts.googleapis.com": ["Google Fonts"],
  "fonts.gstatic.com": ["Google Fonts"],
  "google.com": ["Google Maps"],
  "googleapis.com": ["Google Drive"],
  "accounts.google.com": ["Google Drive"],
  "paypal.com": ["PayPal"],
  "stripe.com": ["Stripe"],
  "supabase.co": ["Supabase"],
};
// Nur Verweise oder Namensräume, kein Datenfluss der Besucherin.
const IGNORIERT = [
  "w3.org", "schema.org", "sitemaps.org", "almabridgeofhope.org", "github.com", "instagram.com",
  "twitter.com", "emailjs.com", "notion.so", "lda.bayern.de", "developer.paypal.com",
  "policies.google.com", "localhost", "spam.example", "platzhalter.supabase.co",
  "sandbox.paypal.com", "meet.jit.si",
];

// Gleich oder Subdomain, nicht bloß gleiches Ende ("evilgoogle.com" ist nicht "google.com").
const passt = (host: string, teil: string) => host === teil || host.endsWith(`.${teil}`);

function quelldateien(): string[] {
  const dateien = [join(REPO, "index.html")];
  const gehe = (ordner: string) => {
    for (const name of readdirSync(ordner)) {
      const pfad = join(ordner, name);
      if (statSync(pfad).isDirectory()) gehe(pfad);
      else if (/\.(tsx?|html)$/.test(name) && !/\.test\.tsx?$/.test(name) && name !== "translations.ts") dateien.push(pfad);
    }
  };
  gehe(join(REPO, "src"));
  gehe(join(REPO, "public"));
  return dateien;
}

function externeHosts(text: string): string[] {
  return [...text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)].map((m) => m[1].toLowerCase());
}

describe("Datenschutzerklärung", () => {
  it("hat in Deutsch und Englisch dieselben Schlüssel", () => {
    expect(privacyKeys("de").sort()).toEqual(privacyKeys("en").sort());
  });

  it("hat für jeden Schlüssel, den die Seite liest, in beiden Sprachen einen Text", () => {
    expect(keysUsedByPage().length).toBeGreaterThan(40);
    const fehlend = keysUsedByPage().filter(
      (key) => !translations.en[key as never] || !translations.de[key as never],
    );
    expect(fehlend).toEqual([]);
  });

  it("verlinkt die Aufsichtsbehörde aus der Übersetzung, nicht fest verdrahtet", () => {
    expect(PRIVACY_PAGE).not.toContain("baden-wuerttemberg");
    expect(translations.de["privacy.complaint.website"]).toBe("https://www.lda.bayern.de");
    expect(translations.en["privacy.complaint.website"]).toBe("https://www.lda.bayern.de");
  });

  it("nennt als Beschwerdestelle nicht die eigene Vereinsanschrift", () => {
    expect(translations.de["privacy.complaint.address"]).not.toContain("Ferchensee");
    expect(translations.en["privacy.complaint.address"]).not.toContain("Ferchensee");
  });

  it("nennt jeden externen Host, den Code oder HTML ansprechen", () => {
    const erklaerung = Object.entries(translations.de)
      .filter(([key]) => key.startsWith("privacy."))
      .map(([, text]) => text)
      .join(" ");
    const unbekannt: string[] = [];
    for (const datei of quelldateien()) {
      for (const host of externeHosts(readFileSync(datei, "utf-8"))) {
        if (IGNORIERT.some((teil) => passt(host, teil))) continue;
        // Der spezifischste Eintrag (längste Endung) gewinnt: accounts.google.com vor google.com.
        const begriffe = Object.entries(ANBIETER).filter(([teil]) => passt(host, teil)).sort((x, y) => y[0].length - x[0].length)[0]?.[1];
        if (!begriffe) unbekannt.push(`${host} (${datei.replace(REPO, "")})`);
        else unbekannt.push(...begriffe.filter((b) => !erklaerung.includes(b)).map((b) => `${b} fehlt in der Erklärung`));
      }
    }
    expect([...new Set(unbekannt)]).toEqual([]);
  });

  it("zeigt am Newsletter-Formular den Einwilligungstext mit Link zur Datenschutzerklärung", () => {
    const formular = readFileSync(join(REPO, "src/components/NewsletterForm.tsx"), "utf-8");
    expect(formular).toContain('t("privacy.newsletter.consent_form")');
    expect(formular).toContain('href="/privacy"');
  });

  it("nennt keinen Dienst ohne Beleg im Code (Notion wird nicht genutzt)", () => {
    const alles = JSON.stringify(Object.entries(translations).flatMap(([, t]) => Object.entries(t).filter(([k]) => k.startsWith("privacy."))));
    expect(alles).not.toContain("Notion");
  });

  it("zeigt kein Stand-Datum vor 2026", () => {
    expect(translations.de["privacy.last_updated"]).toContain("2026");
    expect(translations.en["privacy.last_updated"]).toContain("2026");
  });
});
