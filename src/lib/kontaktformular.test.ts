import { describe, expect, it } from "vitest";
import {
  EMAILJS_VARIABLEN,
  baueTemplateParams,
  fehlendeEmailjsVariablen,
  istHoneypotBefuellt,
} from "./kontaktformular";

const EINGABE = {
  name: "Ada",
  email: "ada@example.org",
  subject: "",
  message: "Hallo",
};

describe("baueTemplateParams", () => {
  it("schickt keinen Empfänger aus dem Browser mit", () => {
    const params = baueTemplateParams(EINGABE);
    expect(params).not.toHaveProperty("to_email");
    expect(Object.keys(params).sort()).toEqual(
      ["from_email", "from_name", "message", "reply_to", "subject"],
    );
  });

  it("setzt Reply-To auf die Adresse der Besucherin", () => {
    expect(baueTemplateParams(EINGABE).reply_to).toBe("ada@example.org");
  });

  it("nimmt einen Standardbetreff, wenn keiner eingegeben wurde", () => {
    expect(baueTemplateParams(EINGABE).subject).toBe("Contact Form Message");
    expect(baueTemplateParams({ ...EINGABE, subject: "Frage" }).subject).toBe("Frage");
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

describe("fehlendeEmailjsVariablen", () => {
  const VOLL = {
    VITE_EMAILJS_SERVICE_ID: "s",
    VITE_EMAILJS_TEMPLATE_ID: "t",
    VITE_EMAILJS_PUBLIC_KEY: "k",
  };

  it("meldet nichts, wenn alle drei gesetzt sind", () => {
    expect(fehlendeEmailjsVariablen(VOLL)).toEqual([]);
  });

  it("meldet fehlende, leere und nur aus Leerzeichen bestehende Werte", () => {
    const env = { VITE_EMAILJS_SERVICE_ID: "", VITE_EMAILJS_TEMPLATE_ID: "  " };
    expect(fehlendeEmailjsVariablen(env)).toEqual([...EMAILJS_VARIABLEN]);
  });

  it("meldet Werte mit Leerzeichen oder Zeilenumbruch am Rand", () => {
    const env = { ...VOLL, VITE_EMAILJS_SERVICE_ID: " s", VITE_EMAILJS_PUBLIC_KEY: "k\n" };
    expect(fehlendeEmailjsVariablen(env)).toEqual([
      "VITE_EMAILJS_SERVICE_ID",
      "VITE_EMAILJS_PUBLIC_KEY",
    ]);
  });
});
