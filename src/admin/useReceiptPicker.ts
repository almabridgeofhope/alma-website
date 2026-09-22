import { useState } from "react";
import { toast } from "sonner";
import type { BelegArt, DriveFile } from "@/lib/googleDrive";

/**
 * Öffnet den Google Picker und meldet Fehler als Hinweis, statt sie zu werfen.
 *
 * Die Drive-Anbindung wird erst beim Klick geladen. Als statischer Import landet
 * sie im gemeinsamen Chunk und damit im öffentlichen Bundle — sie gehört aber in
 * den Verwaltungsbereich.
 */
export const useReceiptPicker = () => {
  const [isPicking, setIsPicking] = useState(false);

  const pick = async (art: BelegArt): Promise<DriveFile | null> => {
    setIsPicking(true);
    try {
      const drive = await import("@/lib/googleDrive");
      if (!drive.isDriveConfigured) {
        toast.error("Google Drive ist in dieser Umgebung nicht eingerichtet.");
        return null;
      }
      return await drive.belegWaehlen(art);
    } catch (error) {
      // Ein abgelaufenes Token sonst ewig behalten wäre die schlechtere Variante.
      const drive = await import("@/lib/googleDrive");
      drive.tokenVerwerfen();
      toast.error((error as Error).message);
      return null;
    } finally {
      setIsPicking(false);
    }
  };

  return { pick, isPicking };
};
