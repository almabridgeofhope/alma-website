import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Bewusst nur Warnung: 43 Stellen mit `any`, viele davon in den Zahlungs-
      // diensten. Typen dort erst nachziehen, wenn die Tests aus Schicht 2 und 4a
      // stehen. Die CI lässt keine neue Warnung mehr zu (`--max-warnings` in ci.yml).
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
