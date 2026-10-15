import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Scroll and split motion belong to the landing page only (DESIGN.md §5).
const LANDING_ONLY = ["locomotive-scroll", "gsap/ScrollTrigger", "gsap/SplitText"];
const landingOnlyMessage = "Landing-only motion library: import it in src/components/landing/ only.";

// Colours come from tokens (tailwind.config.js / globals.css), never hex in a
// class name such as bg-[#fff].
const HEX = "/#[0-9a-fA-F]{3}/";
const noHexInClassName = [
  {
    selector: `JSXAttribute[name.name='className'] Literal[value=${HEX}]`,
    message: "No raw hex in className: use a colour token.",
  },
  {
    selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=${HEX}]`,
    message: "No raw hex in className: use a colour token.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: LANDING_ONLY.map((name) => ({ name, message: landingOnlyMessage })),
      }],
      "no-restricted-syntax": ["error", ...noHexInClassName, {
        // esquery ends a regex at the first "/", so "." stands in for it.
        selector: `ImportExpression[source.value=/^(${LANDING_ONLY.join("|").replaceAll("/", ".")})$/]`,
        message: landingOnlyMessage,
      }],
    },
  },
  {
    files: ["src/components/landing/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
      "no-restricted-syntax": ["error", ...noHexInClassName],
    },
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
