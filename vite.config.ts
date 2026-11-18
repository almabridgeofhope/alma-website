import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { imagetools } from "vite-imagetools";
import { fehlendeEmailjsVariablen } from "./src/lib/kontaktformular";

// Ohne die EmailJS-Werte wäre das Kontaktformular tot. Deshalb bricht der Build ab, statt
// eine Seite auszuliefern, deren Formular nicht sendet. Dev-Server und Vitest brauchen die
// Werte nicht.
function pruefeEmailjsVariablen(mode: string) {  const fehlend = fehlendeEmailjsVariablen(loadEnv(mode, process.cwd(), "VITE_"));
  if (fehlend.length === 0) return;
  throw new Error(
    `Kontaktformular: Umgebungsvariablen fehlen oder sind leer: ${fehlend.join(", ")}. ` +
      "Lokal in .env.local eintragen (Vorlage: .env.example), im Deploy als GitHub Secret oder Variable.",
  );
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  if (command === "build") pruefeEmailjsVariablen(mode);
  return {
    base: "/",
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      imagetools({
        defaultDirectives: (url) => {
          // Automatische Optimierung für alle Bilder
          if (url.searchParams.has('format')) {
            return new URLSearchParams();
          }
          return new URLSearchParams({
            format: 'webp',
            quality: '85',
          });
        },
      }),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
