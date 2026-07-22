import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import tailwind from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  eslint.configs.recommended,
  ...nextCoreWebVitals,
  ...nextTypescript,
  tailwind.configs.recommended,
  {
    plugins: {
      tailwindcss: tailwind,
    },
    settings: {
      tailwindcss: {
        cssConfigPath: resolve(__dirname, "src/app/globals.css"),
        functions: ["cn", "cva", "clsx", "twMerge", "classnames", "ctl", "tv", "tw"],
      },
    },
    rules: {
      // Custom classes defined in globals.css are valid — the plugin can't parse @apply-based class definitions
      "tailwindcss/no-custom-classname": "off",
      // Too noisy — many legitimate arbitrary values have no preset equivalent (e.g. min(), vh+rem combos, percentages)
      // "tailwindcss/no-arbitrary-value": "on",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylistic],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // note you must disable the base rule
      // as it can report incorrect errors
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": [
        "warn",
        {
          ignoreRestArgs: true,
        },
      ],
    },
  },
  {
    // TanStack Table's useReactTable and TanStack Virtual's useVirtualizer return
    // functions and refs that can't be safely memoized, so React Compiler skips these
    // components. The "use no memo" directive is in place at each call site. Silencing
    // the rule here keeps the signal useful elsewhere — a new file using an
    // incompatible hook without mitigation will still warn.
    files: [
      "src/components/shared/data-table.tsx",
      "src/components/shared/file-table.tsx",
      "src/components/workspace/file-viewer/viewers/csv-viewer.tsx",
      "src/components/organisms/reference-genomes/reference-genomes-client.tsx",
      "src/components/taxonomy/taxonomy-tree.tsx",
    ],
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },
);