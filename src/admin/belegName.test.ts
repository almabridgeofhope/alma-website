import { describe, expect, it } from "vitest";
import {
  endungVon,
  geplanterName,
  geplanterUeberweisungsName,
  istSchemaName,
  kurzdatum,
  langdatum,
  nummerFuerName,
  positionsBelegName,
  ueberweisungsBelegName,
} from "./belegName";

// Dateinamen der Belege in Drive: Quittung zu Positionen R<Nr>_<Positionen>, sonst
// <Positionen>_<YYMMDD>; Empfangsquittung zu einer Überweisung ID<Buchung>_R<Nr>_<YYYYMMDD>.

describe("istSchemaName", () => {
  it.each(["R234_WE-WEL-001.jpeg", "R0234_CH-ROOF-002_CH-ROOF-003.pdf", "R12A-3_x.png", "ID13_R231_20260314.jpeg", "ID7_.png"])(
    "erkennt „%s“ als schon nach Schema benannt",
    (name) => {
      expect(istSchemaName(name)).toBe(true);
    },
  );

  it.each(["IMG_1234.jpg", "Receipt_234.jpg", "R_234.jpg", "r234_WE-WEL-001.jpeg", "R234.jpeg", "ID_13.png", "WhatsApp Image 2026-03-14.jpeg", ""])(
    "benennt „%s“ neu",
    (name) => {
      expect(istSchemaName(name)).toBe(false);
    },
  );
});

describe("endungVon", () => {
  it("nimmt die Endung aus dem Namen, klein geschrieben", () => {
    expect(endungVon("IMG_1234.JPG")).toBe(".jpg");
    expect(endungVon("scan.jpeg", "application/pdf")).toBe(".jpeg");
  });

  it("nimmt nur die letzte Endung", () => {
    expect(endungVon("quittung.pdf.HEIC")).toBe(".heic");
  });

  it("fällt ohne Endung im Namen auf den MIME-Typ zurück", () => {
    expect(endungVon("Scan 14.03.", "application/pdf")).toBe(".pdf");
    expect(endungVon("Foto", "image/heic")).toBe(".heic");
  });

  it("liefert ohne Endung und mit unbekanntem oder fehlendem Typ einen Leerstring", () => {
    expect(endungVon("Foto", "image/gif")).toBe("");
    expect(endungVon("Foto")).toBe("");
  });

  it("hält eine 1- oder 6-stellige Endung nicht für eine Endung", () => {
    expect(endungVon("bild.x", "image/png")).toBe(".png");
    expect(endungVon("bild.abcdef", "image/png")).toBe(".png");
  });
});

describe("nummerFuerName", () => {
  it.each([
    ["No. 0234 ", "0234"],
    ["  No. 12", "12"],
    ["no 234", "234"],
    ["Nr. 17", "17"],
    ["nr17", "17"],
    ["#233", "233"],
    ["  1520-B ", "1520-B"],
    ["12/3", "123"],
    ["R 45", "R45"],
  ])("macht aus „%s“ „%s“", (eingabe, erwartet) => {
    expect(nummerFuerName(eingabe)).toBe(erwartet);
  });

  it("schneidet „No“ auch ohne Punkt vom Wortanfang ab: „Nordbank 5“ → „rdbank5“ – Befund, offen", () => {
    // Festgehalten ist das heutige Verhalten, kein Sollwert: das Präfix verlangt weder Punkt noch
    // Wortgrenze. Quittungsnummern beginnen in der Praxis mit „No.“ oder einer Ziffer.
    expect(nummerFuerName("Nordbank 5")).toBe("rdbank5");
  });

  it("liefert einen Leerstring, wenn nur Präfix oder Satzzeichen übrig bleiben", () => {
    expect(nummerFuerName("")).toBe("");
    expect(nummerFuerName("No.")).toBe("");
    expect(nummerFuerName("–")).toBe("");
  });
});

describe("kurzdatum und langdatum", () => {
  it("kürzt ein ISO-Datum auf YYMMDD bzw. YYYYMMDD", () => {
    expect(kurzdatum("2026-03-23")).toBe("260323");
    expect(langdatum("2026-03-14")).toBe("20260314");
  });

  it.each([null, undefined, "", "23.03.2026", "2026-3-23", "2026-03-23T10:00:00Z"])(
    "liefert für %s einen Leerstring",
    (eingabe) => {
      expect(kurzdatum(eingabe)).toBe("");
      expect(langdatum(eingabe)).toBe("");
    },
  );
});

describe("positionsBelegName", () => {
  it("baut R<Nr>_<Position> aus Quittungsnummer und Position", () => {
    expect(positionsBelegName({ nummer: "No. 234", positionen: ["WE-WEL-001"], datum: "2026-03-23", endung: ".jpeg" })).toBe(
      "R234_WE-WEL-001.jpeg",
    );
  });

  it("hängt mehrere Positionen mit Unterstrich an", () => {
    expect(
      positionsBelegName({ nummer: "235", positionen: ["CH-ROOF-002", "CH-ROOF-003"], datum: null, endung: ".pdf" }),
    ).toBe("R235_CH-ROOF-002_CH-ROOF-003.pdf");
  });

  it("nimmt ohne lesbare Nummer <Position>_<YYMMDD>", () => {
    expect(positionsBelegName({ nummer: "", positionen: ["WE-WEL-001"], datum: "2026-03-23", endung: ".jpeg" })).toBe(
      "WE-WEL-001_260323.jpeg",
    );
    expect(positionsBelegName({ nummer: "No.", positionen: ["WE-WEL-001"], datum: "2026-03-23", endung: ".jpeg" })).toBe(
      "WE-WEL-001_260323.jpeg",
    );
  });

  it("lässt ohne Nummer und Datum nur die Position stehen", () => {
    expect(positionsBelegName({ nummer: "", positionen: ["WE-WEL-001"], datum: "unbekannt", endung: ".png" })).toBe(
      "WE-WEL-001.png",
    );
  });

  it("liefert ohne Nummer, Datum und Position nur die Endung – Grenzfall", () => {
    // Heute ruft keine Stelle ohne Position (AddAssignmentDialog und AssignmentsTable geben je eine).
    expect(positionsBelegName({ nummer: "", positionen: [], datum: null, endung: ".jpeg" })).toBe(".jpeg");
  });
});

describe("ueberweisungsBelegName", () => {
  it("baut ID<Buchung>_R<Nr>_<YYYYMMDD>", () => {
    expect(ueberweisungsBelegName({ buchungNr: 21, nummer: "No. 233", datum: "2026-03-14", endung: ".jpeg" })).toBe(
      "ID21_R233_20260314.jpeg",
    );
  });

  it("lässt jeden fehlenden Teil einzeln weg", () => {
    expect(ueberweisungsBelegName({ buchungNr: null, nummer: "233", datum: "2026-03-14", endung: ".jpeg" })).toBe(
      "R233_20260314.jpeg",
    );
    expect(ueberweisungsBelegName({ buchungNr: 21, nummer: "", datum: "2026-03-14", endung: ".jpeg" })).toBe(
      "ID21_20260314.jpeg",
    );
    expect(ueberweisungsBelegName({ buchungNr: 21, nummer: "233", datum: "14.03.2026", endung: ".jpeg" })).toBe(
      "ID21_R233.jpeg",
    );
  });

  it("führt Buchungsnummer 0 als ID0, nicht als fehlend", () => {
    expect(ueberweisungsBelegName({ buchungNr: 0, nummer: "", datum: null, endung: ".pdf" })).toBe("ID0.pdf");
  });

  it("liefert ohne alle drei Teile nur die Endung – Grenzfall", () => {
    // AdminTransferDetail gibt das Buchungsdatum des Transfers als Ersatz mit; fehlt auch das, wäre
    // der Name ".jpeg".
    expect(ueberweisungsBelegName({ buchungNr: null, nummer: "", datum: null, endung: ".jpeg" })).toBe(".jpeg");
  });
});

describe("geplanterName und geplanterUeberweisungsName", () => {
  it("benennt ein Handyfoto nach Schema, die Endung aus dem Dateinamen", () => {
    expect(
      geplanterName({
        datei: { name: "IMG_20260323_101500.JPG", mimeType: "image/jpeg" },
        nummer: "No. 0234",
        positionen: ["WE-WEL-001"],
        datum: "2026-03-23",
      }),
    ).toBe("R0234_WE-WEL-001.jpg");
  });

  it("nimmt die Endung aus dem MIME-Typ, wenn der Name keine hat", () => {
    expect(
      geplanterName({ datei: { name: "Scan", mimeType: "application/pdf" }, nummer: "", positionen: ["CH-ROOF-002"], datum: "2026-04-01" }),
    ).toBe("CH-ROOF-002_260401.pdf");
  });

  it("lässt einen schon nach Schema benannten Beleg in Ruhe (null)", () => {
    expect(
      geplanterName({ datei: { name: "R234_WE-WEL-001.jpeg" }, nummer: "999", positionen: ["CH-ROOF-002"], datum: null }),
    ).toBeNull();
    expect(
      geplanterUeberweisungsName({ datei: { name: "ID21_R233_20260314.jpeg" }, buchungNr: 22, nummer: "1", datum: null }),
    ).toBeNull();
  });

  it("benennt den Beleg einer Überweisung nach Schema", () => {
    expect(
      geplanterUeberweisungsName({
        datei: { name: "WhatsApp Image 2026-03-14 at 10.15.00.jpeg", mimeType: "image/jpeg" },
        buchungNr: 21,
        nummer: "#233",
        datum: "2026-03-14",
      }),
    ).toBe("ID21_R233_20260314.jpeg");
  });
});
