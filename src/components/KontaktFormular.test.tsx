// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { translations } from "@/contexts/translations";

const DE = translations.de;

const send = vi.fn();
const toast = vi.fn();
let letzterResetKey = 0;

vi.mock("@emailjs/browser", () => ({ default: { send: (...args: unknown[]) => send(...args) } }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

// Attrappe des reCAPTCHA-Felds: ein Knopf löst das Rätsel; sie zeigt die Formular-Fehlermeldung.
vi.mock("@/components/RecaptchaFeld", () => ({
  default: (props: {
    siteKey: string;
    onToken: (token: string | null) => void;
    resetKey: number;
    fehler?: string;
  }) => {
    letzterResetKey = props.resetKey;
    return (
      <div data-testid="recaptcha" data-sitekey={props.siteKey}>
        <button type="button" onClick={() => props.onToken("test-token")}>
          rätsel-lösen
        </button>
        {props.fehler && <p role="alert">{props.fehler}</p>}
      </div>
    );
  },
}));

async function zeigeFormular(siteKey: string | undefined = "site-key") {
  vi.resetModules();
  vi.stubEnv("VITE_EMAILJS_SERVICE_ID", "service");
  vi.stubEnv("VITE_EMAILJS_TEMPLATE_ID", "template");
  vi.stubEnv("VITE_EMAILJS_PUBLIC_KEY", "public");
  vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", siteKey ?? "");
  const { LanguageProvider } = await import("@/contexts/LanguageContext");
  const { default: KontaktFormular } = await import("./KontaktFormular");
  render(
    <MemoryRouter>
      <LanguageProvider>
        <KontaktFormular />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

function fuelle() {
  fireEvent.change(screen.getByLabelText(DE["contact.form.name"]), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText(DE["contact.form.email"]), { target: { value: "ada@example.org" } });
  fireEvent.change(screen.getByLabelText(DE["contact.form.message"]), { target: { value: "Hallo" } });
}

const absenden = () => fireEvent.click(screen.getByRole("button", { name: DE["contact.form.submit"] }));

beforeEach(() => {
  localStorage.setItem("alma-language", "de");
  send.mockReset().mockResolvedValue({ status: 200 });
  toast.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe("KontaktFormular mit reCAPTCHA", () => {
  it("reicht den Site-Key aus der Umgebung an das Feld weiter", async () => {
    await zeigeFormular("mein-site-key");
    expect(screen.getByTestId("recaptcha").getAttribute("data-sitekey")).toBe("mein-site-key");
  });

  it("sendet den Token als g-recaptcha-response mit", async () => {
    await zeigeFormular();
    fuelle();
    fireEvent.click(screen.getByText("rätsel-lösen"));
    absenden();
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const [service, template, params, key] = send.mock.calls[0];
    expect([service, template, key]).toEqual(["service", "template", "public"]);
    expect(params["g-recaptcha-response"]).toBe("test-token");
    expect(params).not.toHaveProperty("to_email");
  });

  it("sendet ohne Token nichts und zeigt den Fehler sichtbar", async () => {
    await zeigeFormular();
    fuelle();
    absenden();
    expect((await screen.findByRole("alert")).textContent).toBe(DE["contact.recaptcha.required"]);
    expect(send).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
  });

  it("sendet ohne Site-Key nichts (kein stilles Überspringen des Schutzes)", async () => {
    await zeigeFormular("");
    fuelle();
    fireEvent.click(screen.getByText("rätsel-lösen"));
    absenden();
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" })));
    expect(send).not.toHaveBeenCalled();
  });

  it("verbraucht den Token: nach dem Versand wird das Feld zurückgesetzt und ein zweiter Versand braucht ein neues Rätsel", async () => {
    await zeigeFormular();
    fuelle();
    fireEvent.click(screen.getByText("rätsel-lösen"));
    absenden();
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(letzterResetKey).toBe(1));
    fuelle();
    absenden();
    expect(await screen.findByText(DE["contact.recaptcha.required"])).toBeTruthy();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("meldet einen Fehler von EmailJS (etwa abgelehnter Token) sichtbar und setzt das Feld zurück", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockRejectedValue(new Error("The g-recaptcha-response parameter is invalid"));
    await zeigeFormular();
    fuelle();
    fireEvent.click(screen.getByText("rätsel-lösen"));
    absenden();
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive", description: DE["contact.error.send"] }),
      ),
    );
    await waitFor(() => expect(letzterResetKey).toBe(1));
  });

  it("sendet bei gefülltem Honigtopf nichts, auch mit Token", async () => {
    await zeigeFormular();
    fuelle();
    fireEvent.change(document.getElementById("kontakt-zusatzfeld") as HTMLInputElement, { target: { value: "spam" } });
    fireEvent.click(screen.getByText("rätsel-lösen"));
    absenden();
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(send).not.toHaveBeenCalled();
  });
});
