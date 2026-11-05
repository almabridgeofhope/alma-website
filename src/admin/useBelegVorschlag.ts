import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { DriveFile } from "@/lib/googleDrive";

/** Was die Funktion receipt-read (alma-data-platform) auf dem Beleg erkannt hat. */
export interface BelegVorschlag {
  receipt_no: string | null;
  date: string | null;
  amount: number | null;
  currency: string | null;
  purpose: string | null;
  several_receipts: boolean;
}

export type LeseStatus = "idle" | "reading" | "done" | "failed";

/**
 * Liest einen gewählten Beleg aus und hält Nummer und Datum als bearbeitbare Felder.
 * Ein Fehler beim Lesen blockiert nichts — die Felder bleiben dann einfach leer.
 */
export const useBelegVorschlag = () => {
  const [status, setStatus] = useState<LeseStatus>("idle");
  const [vorschlag, setVorschlag] = useState<BelegVorschlag | null>(null);
  const [nummer, setNummer] = useState("");
  const [datum, setDatum] = useState("");
  const [nummerGelesen, setNummerGelesen] = useState(false);
  const [datumGelesen, setDatumGelesen] = useState(false);
  // Wer schnell einen zweiten Beleg wählt, soll nicht die Antwort zum ersten sehen.
  const lauf = useRef(0);

  const lesen = async (datei: DriveFile) => {
    const meinLauf = ++lauf.current;
    setStatus("reading");
    setVorschlag(null);
    setNummer("");
    setDatum("");
    setNummerGelesen(false);
    setDatumGelesen(false);

    try {
      const drive = await import("@/lib/googleDrive");
      const inhalt = await drive.belegLaden(datei);
      const { data, error } = await supabase.functions.invoke("receipt-read", { body: inhalt });
      if (meinLauf !== lauf.current) return;
      if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? "Reading failed.");

      const gelesen = data.suggestion as BelegVorschlag;
      // Bei einer Sammelaufstellung ist keine einzelne Nummer die richtige.
      const eineNummer = gelesen.several_receipts ? null : gelesen.receipt_no;
      setVorschlag(gelesen);
      setNummer(eineNummer ?? "");
      setNummerGelesen(eineNummer !== null);
      setDatum(gelesen.date ?? "");
      setDatumGelesen(gelesen.date !== null);
      setStatus("done");
    } catch (fehler) {
      if (meinLauf !== lauf.current) return;
      console.error("receipt-read", fehler);
      setStatus("failed");
    }
  };

  return {
    status,
    vorschlag,
    nummer,
    datum,
    nummerGelesen,
    datumGelesen,
    lesen,
    nummerAendern: (wert: string) => {
      setNummer(wert);
      setNummerGelesen(false);
    },
    datumAendern: (wert: string) => {
      setDatum(wert);
      setDatumGelesen(false);
    },
  };
};

/**
 * Benennt den Beleg nach dem Speichern um. Die Zuordnung steht dann schon; ein Fehler
 * kostet nur den Namen und wird als Warnung gemeldet.
 */
export const belegNachSchemaBenennen = async (datei: DriveFile, neuerName: string | null) => {
  if (!neuerName || neuerName === datei.name) return;
  try {
    const drive = await import("@/lib/googleDrive");
    await drive.belegUmbenennen(datei.id, neuerName);
  } catch (error) {
    toast.warning(`Saved, but the receipt keeps its old name: ${(error as Error).message}`);
  }
};
