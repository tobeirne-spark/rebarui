import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  // bench/** is disposable benchmark scaffold/experiment code by design (see ref/PLAN.md) — same
  // exclusion turbo's test/typecheck/build tasks already apply, just not previously mirrored here.
  // ref/** is planning docs plus git-ignored personal scratch/research content (e.g.
  // ref/whiteroom/dng-interop/*, never committed — see .gitignore) that was never meant to be
  // linted as shipped code; CI never sees it (the same reason it never flags it there), so
  // excluding it here just makes a local `pnpm run lint` match what CI actually checks instead of
  // drowning real, actionable errors in thousands from disposable one-off scripts.
  { ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**", "apps/**", "bench/**", "ref/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "jsx-a11y/alt-text": "error",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
