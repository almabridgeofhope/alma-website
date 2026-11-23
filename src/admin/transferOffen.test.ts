import { describe, expect, it } from "vitest";
import { offenVonTransfer } from "./transferOffen";

const bestaetigt = { amount: -1000, original_amount: 4_000_000, erhalten_bestaetigt_am: "2026-08-07" };

describe("offenVonTransfer", () => {
  it("zieht das Zugeordnete vom bestaetigten UGX-Betrag ab", () => {
    expect(offenVonTransfer(bestaetigt, 1_500_000, 4000).ugx).toBe(2_500_000);
  });

  it("rechnet den Euro-Rest mit dem Planungskurs", () => {
    expect(offenVonTransfer(bestaetigt, 1_500_000, 4000).eur).toBe(625);
  });

  it("zeigt UGX nicht, solange die Ankunft nicht bestaetigt ist", () => {
    const offen = offenVonTransfer({ ...bestaetigt, erhalten_bestaetigt_am: null }, 0, 4000);
    expect(offen.ugx).toBeNull();
    expect(offen.eur).toBe(1000);
  });

  it("zeigt Euro nicht ohne Kurs", () => {
    expect(offenVonTransfer(bestaetigt, 0, null).eur).toBeNull();
  });

  it("wird negativ, wenn mehr zugeordnet ist als ankam", () => {
    expect(offenVonTransfer(bestaetigt, 4_100_000, 4000).ugx).toBe(-100_000);
  });
});
