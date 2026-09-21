import { createClient } from "@supabase/supabase-js";

// Vite ersetzt import.meta.env.VITE_* nur bei statischem Zugriff — ein dynamischer
// Schlüssel bliebe im Produktionsbuild leer.
const trimmed = (value?: string): string => (value ?? "").trim();

const SUPABASE_URL = trimmed(import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_PUBLISHABLE_KEY = trimmed(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const isSupabaseConfigured = SUPABASE_URL !== "" && SUPABASE_PUBLISHABLE_KEY !== "";

// Ohne Konfiguration würde createClient beim Import werfen. Die Platzhalter halten das
// Modul ladbar; die Oberfläche prüft isSupabaseConfigured und erklärt, was fehlt.
export const supabase = createClient(
  SUPABASE_URL || "https://platzhalter.supabase.co",
  SUPABASE_PUBLISHABLE_KEY || "platzhalter",
  { auth: { persistSession: true, autoRefreshToken: true } },
);

export const RECEIPTS_BUCKET = "receipts";
