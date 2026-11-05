/**
 * Belege liegen in Google Drive, nicht im Supabase-Bucket.
 *
 * Hochladen und Auswählen erledigt beides der Google Picker: seine Upload-Ansicht
 * schreibt direkt in den Zielordner, seine Dateiansicht zeigt, was schon darin liegt.
 * Das hat zwei Vorteile gegenüber einem eigenen Upload — Google kümmert sich um
 * grosse Dateien und Fortschritt, und der Zugriff bleibt beim schmalen Bereich
 * drive.file: die App sieht nur, was sie selbst angelegt hat oder was hier gewählt
 * wurde, nicht das ganze Laufwerk.
 */

const trimmed = (value?: string): string => (value ?? "").trim();

export const GOOGLE_CLIENT_ID = trimmed(import.meta.env.VITE_GOOGLE_CLIENT_ID);
// Eigener Name, damit der Picker-Key nicht mit anderen Google-Keys verwechselt wird.
export const GOOGLE_API_KEY = trimmed(import.meta.env.VITE_GOOGLE_PICKER_API_KEY);
export const GOOGLE_APP_ID = trimmed(import.meta.env.VITE_GOOGLE_APP_ID);

/** Faellt auf den alten Sammelordner zurueck, solange die getrennten Ordner nicht gesetzt sind. */
const ordnerId = (eigener?: string, sammel?: string): string => trimmed(eigener) || trimmed(sammel);

export const DRIVE_FOLDER_UEBERWEISUNGEN = ordnerId(
  import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_UEBERWEISUNGEN,
  import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
);
export const DRIVE_FOLDER_POSITIONEN = ordnerId(
  import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_POSITIONEN,
  import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
);

/** Welcher Beleg gemeint ist — der Transfer selbst oder eine bezahlte Position. */
export type BelegArt = "ueberweisung" | "position";

const ordnerFuer = (art: BelegArt): string =>
  art === "ueberweisung" ? DRIVE_FOLDER_UEBERWEISUNGEN : DRIVE_FOLDER_POSITIONEN;

export const isDriveConfigured =
  GOOGLE_CLIENT_ID !== "" &&
  GOOGLE_API_KEY !== "" &&
  GOOGLE_APP_ID !== "" &&
  DRIVE_FOLDER_UEBERWEISUNGEN !== "" &&
  DRIVE_FOLDER_POSITIONEN !== "";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const GAPI_SRC = "https://apis.google.com/js/api.js";

export interface DriveFile {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

const geladeneSkripte = new Map<string, Promise<void>>();

const skriptLaden = (src: string): Promise<void> => {
  const vorhanden = geladeneSkripte.get(src);
  if (vorhanden) return vorhanden;

  const geladen = new Promise<void>((resolve, reject) => {
    const element = document.createElement("script");
    element.src = src;
    element.async = true;
    element.onload = () => resolve();
    element.onerror = () => reject(new Error(`Google script not reachable: ${src}`));
    document.head.appendChild(element);
  });

  geladeneSkripte.set(src, geladen);
  return geladen;
};

let zugriffsToken: string | null = null;

/**
 * Holt ein Zugriffstoken. Beim ersten Mal erscheint die Google-Anmeldung, danach
 * versucht es die stille Erneuerung; erst wenn die scheitert, fragt Google erneut.
 */
const tokenHolen = async (): Promise<string> => {
  if (zugriffsToken) return zugriffsToken;

  await skriptLaden(GIS_SRC);

  return new Promise<string>((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (antwort: { access_token?: string; error?: string }) => {
        if (antwort.error || !antwort.access_token) {
          reject(new Error("Google did not confirm access."));
          return;
        }
        zugriffsToken = antwort.access_token;
        resolve(antwort.access_token);
      },
      error_callback: () => reject(new Error("The Google sign-in was cancelled.")),
    });

    client.requestAccessToken({ prompt: "" });
  });
};

const pickerLaden = async (): Promise<void> => {
  await skriptLaden(GAPI_SRC);
  if (window.google?.picker) return;

  await new Promise<void>((resolve, reject) => {
    window.gapi.load("picker", {
      callback: () => resolve(),
      onerror: () => reject(new Error("The Google Picker could not be loaded.")),
    });
  });
};

/**
 * Öffnet den Picker im Belegordner der jeweiligen Art. Rückgabe ist die gewählte
 * oder gerade hochgeladene Datei, oder null, wenn abgebrochen wurde.
 *
 * Es gibt zwei getrennte Ordner: Überweisungsbelege gehören zur Buchung, die
 * Quittungen aus Uganda zu den einzelnen Positionen.
 *
 * Der Dateityp ist bewusst nicht eingeschränkt — PDF und JPEG sind der Alltag,
 * aber was aus Uganda kommt, ist mal ein PNG, mal ein Foto aus einer App.
 */
export async function belegWaehlen(art: BelegArt): Promise<DriveFile | null> {
  if (!isDriveConfigured) {
    throw new Error("Google Drive is not configured in this environment.");
  }

  const ordner = ordnerFuer(art);
  const token = await tokenHolen();
  await pickerLaden();
  const picker = window.google.picker;

  return new Promise<DriveFile | null>((resolve, reject) => {
    try {
      const hochladen = new picker.DocsUploadView().setParent(ordner);
      const vorhandene = new picker.DocsView(picker.ViewId.DOCS)
        .setParent(ordner)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      const dialog = new picker.PickerBuilder()
        .setAppId(GOOGLE_APP_ID)
        .setOAuthToken(token)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setTitle(
          art === "ueberweisung"
            ? "Upload or choose a transfer receipt"
            : "Upload or choose an item receipt",
        )
        .addView(hochladen)
        .addView(vorhandene)
        .setCallback((daten: any) => {
          if (daten.action === picker.Action.PICKED) {
            const datei = daten.docs?.[0];
            resolve(
              datei
                ? {
                    id: datei.id,
                    name: datei.name ?? datei.id,
                    url: datei.url ?? `https://drive.google.com/file/d/${datei.id}/view`,
                    mimeType: datei.mimeType,
                  }
                : null,
            );
            return;
          }
          if (daten.action === picker.Action.CANCEL) {
            resolve(null);
          }
        })
        .build();

      dialog.setVisible(true);
    } catch (fehler) {
      reject(fehler as Error);
    }
  });
}

/** Ein Beleg so, wie ihn die Lese-Funktion erwartet: base64 ohne Präfix plus Typ. */
export interface BelegInhalt {
  data: string;
  media_type: string;
}

// Groß genug für handschriftliche Ziffern, klein genug für die 5-MB-Grenze der API.
const MAX_KANTE = 1800;

const alsBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const leser = new FileReader();
    leser.onload = () => resolve(String(leser.result).split(",")[1] ?? "");
    leser.onerror = () => reject(new Error("The receipt could not be read from Drive."));
    leser.readAsDataURL(blob);
  });

/** Fotos kommen oft mit 4000 px und als HEIC — beides wird hier zu einem handlichen JPEG. */
const verkleinern = async (blob: Blob): Promise<Blob> => {
  const bild = await createImageBitmap(blob);
  const faktor = Math.min(1, MAX_KANTE / Math.max(bild.width, bild.height));
  const leinwand = document.createElement("canvas");
  leinwand.width = Math.round(bild.width * faktor);
  leinwand.height = Math.round(bild.height * faktor);
  leinwand.getContext("2d")?.drawImage(bild, 0, 0, leinwand.width, leinwand.height);
  bild.close();
  return new Promise((resolve, reject) =>
    leinwand.toBlob(
      (jpeg) => (jpeg ? resolve(jpeg) : reject(new Error("The photo could not be converted."))),
      "image/jpeg",
      0.85,
    ),
  );
};

/**
 * Lädt eine gerade gewählte Datei aus Drive. drive.file erlaubt das, weil die Datei
 * über den Picker kam. PDFs gehen unverändert weiter, Bilder verkleinert als JPEG.
 */
export async function belegLaden(datei: DriveFile): Promise<BelegInhalt> {
  const token = await tokenHolen();
  const antwort = await fetch(`https://www.googleapis.com/drive/v3/files/${datei.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!antwort.ok) throw new Error(`Drive did not return the receipt (${antwort.status}).`);
  const blob = await antwort.blob();
  const typ = datei.mimeType || blob.type;
  if (typ === "application/pdf") return { data: await alsBase64(blob), media_type: typ };
  return { data: await alsBase64(await verkleinern(blob)), media_type: "image/jpeg" };
}

/** Benennt eine über den Picker gewählte Datei um; Link und ID bleiben gleich. */
export async function belegUmbenennen(id: string, name: string): Promise<void> {
  const token = await tokenHolen();
  const antwort = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!antwort.ok) throw new Error(`Drive did not rename the receipt (${antwort.status}).`);
}

/** Nach einem abgelaufenen Token einmal neu anmelden lassen. */
export const tokenVerwerfen = (): void => {
  zugriffsToken = null;
};
