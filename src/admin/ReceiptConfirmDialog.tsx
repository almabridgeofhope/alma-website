import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DriveFile } from "@/lib/googleDrive";
import BelegVorschlagFelder from "./BelegVorschlagFelder";
import { belegNachSchemaBenennen, useBelegVorschlag } from "./useBelegVorschlag";

interface ReceiptConfirmDialogProps {
  datei: DriveFile;
  /** Neuer Dateiname aus gelesener Nummer und Datum; null, wenn der Name bleibt. */
  benennen: (nummer: string, datum: string | null | undefined) => string | null;
  titel: string;
  betragUgx: number | null;
  /** Datum für den Namen, falls auf dem Beleg keines lesbar ist. */
  ersatzDatum: string | null | undefined;
  /** Speichert den Link; erst danach wird umbenannt. */
  speichern: (datei: DriveFile) => Promise<void>;
  onClose: () => void;
}

/** Nachgereichter Beleg: auslesen, bestätigen lassen, dann verknüpfen und umbenennen. */
const ReceiptConfirmDialog = ({
  datei,
  benennen,
  titel,
  betragUgx,
  ersatzDatum,
  speichern,
  onClose,
}: ReceiptConfirmDialogProps) => {
  const beleg = useBelegVorschlag();
  const [speichert, setSpeichert] = useState(false);
  const { lesen } = beleg;

  useEffect(() => {
    void lesen(datei);
    // Nur beim Öffnen lesen; ein neuer Beleg öffnet einen neuen Dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datei.id]);

  const neuerName =
    beleg.status === "reading"
      ? null
      : benennen(beleg.nummer, beleg.datum || ersatzDatum?.slice(0, 10));

  const bestaetigen = async () => {
    setSpeichert(true);
    try {
      await speichern(datei);
      await belegNachSchemaBenennen(datei, neuerName);
      toast.success(`Receipt linked${neuerName ? ` as ${neuerName}` : ""}.`);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSpeichert(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !speichert && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link receipt</DialogTitle>
          <DialogDescription>
            {titel} · <span className="break-all">{datei.name}</span>
          </DialogDescription>
        </DialogHeader>

        <BelegVorschlagFelder beleg={beleg} betragUgx={betragUgx} neuerName={neuerName} />

        <DialogFooter>
          <Button type="button" variant="ghost" disabled={speichert} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={speichert || beleg.status === "reading"} onClick={bestaetigen}>
            {speichert && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Link receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptConfirmDialog;
