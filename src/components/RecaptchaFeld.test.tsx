// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { translations } from "@/contexts/translations";
import { istRecaptchaSkriptGeladen, vergesseRecaptchaLadezustand } from "@/lib/recaptcha";
import RecaptchaFeld from "./RecaptchaFeld";

const DE = translations.de;
const SKRIPT = 'script[src*="google.com/recaptcha"]';

function fakeGrecaptcha() {
  const renderAufruf = vi.fn((_el: HTMLElement, _params: unknown) => 7);
  const g = {
    ready: (cb: () => void) => cb(),
    render: renderAufruf,
    reset: vi.fn(),
  };
  return { g, renderAufruf };
}

function zeige(props: Partial<React.ComponentProps<typeof RecaptchaFeld>> = {}) {
  const onToken = vi.fn();
  const ansicht = render(
    <MemoryRouter>
      <LanguageProvider>
        <RecaptchaFeld siteKey="site-key" onToken={onToken} resetKey={0} {...props} />
      </LanguageProvider>
    </MemoryRouter>,
  );
  return { onToken, ...ansicht };
}

beforeEach(() => {
  localStorage.setItem("alma-language", "de");
  vergesseRecaptchaLadezustand();
});

afterEach(() => {
  cleanup();
  document.head.querySelectorAll(SKRIPT).forEach((el) => el.remove());
  delete window.grecaptcha;
  localStorage.clear();
});

describe("RecaptchaFeld, Einwilligung", () => {
  it("lädt das Google-Skript nicht beim Anzeigen", () => {
    zeige();
    expect(document.querySelector(SKRIPT)).toBeNull();
    expect(istRecaptchaSkriptGeladen()).toBe(false);
  });

  it("zeigt Hinweis, Link zur Datenschutzerklärung und den Knopf, aber noch kein Widget", () => {
    zeige();
    expect(screen.getByRole("link", { name: DE["contact.recaptcha.privacyLink"] }).getAttribute("href")).toBe("/privacy");
    expect(screen.getByRole("button", { name: DE["contact.recaptcha.load"] })).toBeTruthy();
    expect(window.grecaptcha).toBeUndefined();
  });

  it("lädt das Skript erst nach dem Klick auf den Knopf, mit explizitem Rendern und Sprache", () => {
    zeige();
    fireEvent.click(screen.getByRole("button", { name: DE["contact.recaptcha.load"] }));
    const skript = document.querySelector<HTMLScriptElement>(SKRIPT);
    expect(skript).not.toBeNull();
    expect(skript?.src).toContain("render=explicit");
    expect(skript?.src).toContain("hl=de");
  });

  it("zeichnet nach dem Laden das Widget mit dem Site-Key und gibt den Token weiter", () => {
    const { onToken } = zeige();
    fireEvent.click(screen.getByRole("button", { name: DE["contact.recaptcha.load"] }));
    const { g, renderAufruf } = fakeGrecaptcha();
    window.grecaptcha = g;
    fireEvent.load(document.querySelector(SKRIPT) as HTMLScriptElement);

    return vi.waitFor(() => {
      expect(renderAufruf).toHaveBeenCalledTimes(1);
      const params = renderAufruf.mock.calls[0][1] as {
        sitekey: string;
        callback: (t: string) => void;
        "expired-callback": () => void;
      };
      expect(params.sitekey).toBe("site-key");
      params.callback("gelöster-token");
      expect(onToken).toHaveBeenLastCalledWith("gelöster-token");
      params["expired-callback"]();
      expect(onToken).toHaveBeenLastCalledWith(null);
    });
  });

  it("meldet einen Ladefehler sichtbar und erlaubt einen neuen Versuch", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    zeige();
    fireEvent.click(screen.getByRole("button", { name: DE["contact.recaptcha.load"] }));
    fireEvent.error(document.querySelector(SKRIPT) as HTMLScriptElement);
    const alarm = await screen.findByRole("alert");
    expect(alarm.textContent).toContain("info@almabridgeofhope.org");
    expect(document.querySelector(SKRIPT)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: DE["contact.recaptcha.load"] }));
    expect(document.querySelector(SKRIPT)).not.toBeNull();
  });

  it("setzt das Widget zurück, wenn sich resetKey ändert", async () => {
    const { onToken, rerender } = zeige();
    fireEvent.click(screen.getByRole("button", { name: DE["contact.recaptcha.load"] }));
    const { g, renderAufruf } = fakeGrecaptcha();
    window.grecaptcha = g;
    fireEvent.load(document.querySelector(SKRIPT) as HTMLScriptElement);
    await vi.waitFor(() => expect(renderAufruf).toHaveBeenCalled());

    rerender(
      <MemoryRouter>
        <LanguageProvider>
          <RecaptchaFeld siteKey="site-key" onToken={onToken} resetKey={1} />
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(g.reset).toHaveBeenCalledWith(7);
    expect(onToken).toHaveBeenLastCalledWith(null);
  });

  it("meldet einen Fehler des Widgets sichtbar", async () => {
    const { onToken } = zeige();
    fireEvent.click(screen.getByRole("button", { name: DE["contact.recaptcha.load"] }));
    const { g, renderAufruf } = fakeGrecaptcha();
    window.grecaptcha = g;
    fireEvent.load(document.querySelector(SKRIPT) as HTMLScriptElement);
    await vi.waitFor(() => expect(renderAufruf).toHaveBeenCalled());
    const params = renderAufruf.mock.calls[0][1] as { "error-callback": () => void };
    act(() => params["error-callback"]());
    expect((await screen.findByRole("alert")).textContent).toBe(DE["contact.recaptcha.widgetError"]);
    expect(onToken).toHaveBeenLastCalledWith(null);
  });

  it("gibt nach Ablauf der Wartezeit auf ready auf und zeigt den Ladefehler", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    try {
      zeige();
      fireEvent.click(screen.getByRole("button", { name: DE["contact.recaptcha.load"] }));
      window.grecaptcha = { ready: () => {}, render: vi.fn(), reset: vi.fn() };
      fireEvent.load(document.querySelector(SKRIPT) as HTMLScriptElement);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_500);
      });
      expect(screen.getByRole("alert").textContent).toBe(DE["contact.recaptcha.loadError"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("zeichnet das Widget nach erneutem Einblenden ohne zweiten Klick, wenn das Skript schon läuft", async () => {
    zeige();
    fireEvent.click(screen.getByRole("button", { name: DE["contact.recaptcha.load"] }));
    const { g, renderAufruf } = fakeGrecaptcha();
    window.grecaptcha = g;
    fireEvent.load(document.querySelector(SKRIPT) as HTMLScriptElement);
    await vi.waitFor(() => expect(renderAufruf).toHaveBeenCalledTimes(1));
    cleanup();
    zeige();
    await vi.waitFor(() => expect(renderAufruf).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("button", { name: DE["contact.recaptcha.load"] })).toBeNull();
  });

  it("ist ohne Site-Key nicht bedienbar und sagt es sichtbar", () => {
    zeige({ siteKey: "" });
    expect((screen.getByRole("button", { name: DE["contact.recaptcha.load"] }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("alert").textContent).toBe(DE["contact.recaptcha.notConfigured"]);
    expect(document.querySelector(SKRIPT)).toBeNull();
  });

  it("zeigt die Fehlermeldung des Formulars am Feld", () => {
    zeige({ fehler: "Bitte bestätigen" });
    expect(screen.getByRole("alert").textContent).toBe("Bitte bestätigen");
  });
});
