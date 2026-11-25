import { describe, expect, it } from "vitest";
import {
  KONTAKT_VARIABLEN,
  baueTemplateParams,
  fehlendeKontaktVariablen,
  istHoneypotBefuellt,
} from "./kontaktformular";

const TOKEN = "token-aus-dem-recaptcha";

const EINGABE = {
  name: "Ada",
  email: "ada@example.org",
  subject: "",
  message: "Hallo",
};

describe("baueTemplateParams", () => {
  it("schickt keinen Empfänger aus dem Browser mit", () => {
    const params = baueTemplateParams(EINGABE, TOKEN);
    expect(params).not.toHaveProperty("to_email");
    expect(Object.keys(params).sort()).toEqual(
      ["from_email", "from_name", "g-recaptcha-response", "message", "reply_to", "subject"],
    );
  });

  it("schickt den reCAPTCHA-Token unter dem Namen g-recaptcha-response mit", () => {
    expect(baueTemplateParams(EINGABE, TOKEN)["g-recaptcha-response"]).toBe(TOKEN);
  });

  it("setzt Reply-To auf die Adresse der Besucherin", () => {
    expect(baueTemplateParams(EINGABE, TOKEN).reply_to).toBe("ada@example.org");
  });

  it("nimmt einen Standardbetreff, wenn keiner eingegeben wurde", () => {
    expect(baueTemplateParams(EINGABE, TOKEN).subject).toBe("Contact Form Message");
    expect(baueTemplateParams({ ...EINGABE, subject: "Frage" }, TOKEN).subject).toBe("Frage");
  });
});

describe("istHoneypotBefuellt", () => {
  it("ist bei leerem Feld falsch", () => {
    expect(istHoneypotBefuellt("")).toBe(false);
  });

  it("ist bei jedem Inhalt wahr, auch bei Leerzeichen", () => {
    expect(istHoneypotBefuellt("http://spam.example")).toBe(true);
    expect(istHoneypotBefuellt(" ")).toBe(true);
  });
});

describe("fehlendeKontaktVariablen", () => {
  const VOLL = {
    VITE_EMAILJS_SERVICE_ID: "s",
    VITE_EMAILJS_TEMPLATE_ID: "t",
    VITE_EMAILJS_PUBLIC_KEY: "k",
    VITE_RECAPTCHA_SITE_KEY: "r",
  };

  it("meldet nichts, wenn alle vier gesetzt sind", () => {
    expect(fehlendeKontaktVariablen(VOLL)).toEqual([]);
  });

  it("meldet fehlende, leere und nur aus Leerzeichen bestehende Werte", () => {
    const env = { VITE_EMAILJS_SERVICE_ID: "", VITE_EMAILJS_TEMPLATE_ID: "  " };
    expect(fehlendeKontaktVariablen(env)).toEqual([...KONTAKT_VARIABLEN]);
  });

  it("meldet einen fehlenden reCAPTCHA-Site-Key, damit der Build nicht ohne Spamschutz entsteht", () => {
    const { VITE_RECAPTCHA_SITE_KEY: _weg, ...ohneKey } = VOLL;
    expect(fehlendeKontaktVariablen(ohneKey)).toEqual(["VITE_RECAPTCHA_SITE_KEY"]);
  });

  it("meldet Werte mit Leerzeichen oder Zeilenumbruch am Rand", () => {
    const env = { ...VOLL, VITE_EMAILJS_SERVICE_ID: " s", VITE_EMAILJS_PUBLIC_KEY: "k\n" };
    expect(fehlendeKontaktVariablen(env)).toEqual([
      "VITE_EMAILJS_SERVICE_ID",
      "VITE_EMAILJS_PUBLIC_KEY",
    ]);
  });
});
