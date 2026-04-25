import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

const ignoreConfig = {
  ignores: ["**/*.{js,mjs,cjs}", "code/**"],
};


export default defineConfig([
  ignoreConfig,
  {
    files: ["./mods/**/*.{ts,mts,cts}", "./test/**/*.{ts,mts,cts}"],
    languageOptions: {
      globals: globals.browser, parserOptions: {
        "ecmaVersion": "latest",
        "sourceType": "module",
        parser: "@typescript-eslint/parser"
      },
    },
    "settings": {
      "import/ignore": ["^modlib$", "^mod$"],
    }
  },
  tseslint.configs.recommended,
]);