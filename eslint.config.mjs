import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next only wires in 6 jsx-a11y rules (alt-text, aria-props, and a
  // few others) — notably not label-has-associated-control, the rule that would
  // have caught the contact form's unlabeled inputs. eslint-config-next already
  // registers the "jsx-a11y" plugin itself, and flat config errors on a second
  // `plugins` entry under the same name — so only the rule set is merged in here,
  // not flatConfigs.recommended's own `plugins` key.
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
