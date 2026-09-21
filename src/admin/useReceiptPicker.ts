import { useState } from "react";
import { toast } from "sonner";
import { belegWaehlen, isDriveConfigured, tokenVerwerfen, type DriveFile } from "@/lib/googleDrive";

/** Öffnet den Google Picker und meldet Fehler als Hinweis, statt sie zu werfen. */
export const useReceiptPicker = () => {
  const [isPicking, setIsPicking] = useState(false);

  const pick = async (): Promise<DriveFile | null> => {
    if (!isDriveConfigured) {
      toast.error("Google Drive ist in dieser Umgebung nicht eingerichtet.");
      return null;
    }

    setIsPicking(true);
    try {
      return await belegWaehlen();
    } catch (error) {
      // Ein abgelaufenes Token sonst ewig behalten wäre die schlechtere Variante.
      tokenVerwerfen();
      toast.error((error as Error).message);
      return null;
    } finally {
      setIsPicking(false);
    }
  };

  return { pick, isPicking };
};
