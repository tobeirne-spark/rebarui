import { defineConfig } from "tsup";

export default defineConfig({
  // Object form (not an array) so the orb-shader entry lands at a predictable `dist/orb-shader/`
  // path matching the "./orb-shader" subpath export in package.json, rather than tsup's default
  // basename-collision handling for two same-named "index.ts" entries.
  entry: {
    index: "src/index.ts",
    "orb-shader/index": "src/orb-shader/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  // `three` (and its postprocessing subpath imports, used only by orb-shader/createOrbRenderer.ts)
  // and `html2canvas` (used only by FloatAssistant's screenshot capture) stay external rather than
  // bundled: both are dynamically imported specifically so consumers who never use that one
  // feature never pay for the dependency. Bundling either into dist/index.js here would silently
  // defeat that regardless of the dynamic import — the consuming app's own bundler needs to see
  // the real `import("...")` calls to code-split them.
  external: [
    "react",
    "react-dom",
    "three",
    "three/examples/jsm/postprocessing/EffectComposer.js",
    "three/examples/jsm/postprocessing/RenderPass.js",
    "three/examples/jsm/postprocessing/UnrealBloomPass.js",
    "three/examples/jsm/postprocessing/OutputPass.js",
    "html2canvas",
  ],
  publicDir: "src/styles",
  banner: {
    js: '"use client";',
  },
});
