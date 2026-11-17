import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

// Unit-Tests (Schicht 2, TESTING.md): dieselbe Vite-Konfiguration wie der Build, damit der
// Alias "@" auch in Tests gilt. Nur Dateien unter src/ – die Playwright-Specs unter e2e/
// (Schicht 8) gehören nicht hierher.
export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      include: ["src/**/*.test.{ts,tsx}"],
    },
  }),
);
