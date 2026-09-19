// Regenerates icons-remix.tsx and icons-antd.tsx from the real, currently-installed
// `remixicon`/`@ant-design/icons-svg` packages (see package.json devDependencies) — real path
// data, never hand-traced. Run via `pnpm --filter rebar-ui run generate:icons` after bumping
// either package's version, then rebuild/test/typecheck as usual before committing the
// regenerated output — this script's own output IS the shipped source, not a build artifact.
//
// Rules (see icons.tsx's own doc comment for the full rationale):
// - Never regenerate a name already hand-picked in icons.tsx (EXISTING_REMIX_NAMES/
//   EXISTING_ANTD_NAMES below) — those are curated, tested, and may already be referenced
//   elsewhere in this codebase under that exact name.
// - RemixIcon: prefer each icon's "-line" style SVG; fall back to "-fill" only when no "-line"
//   variant exists for that base name.
// - Ant Design: Outlined theme only (never Filled/TwoTone — visually inconsistent next to
//   RemixIcon's uniform line weight).
// - Where the same real-world icon exists in both libraries (matched by normalized name, ignoring
//   a trailing numeric variant like "-2"), RemixIcon wins — the Ant Design version is dropped.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coreDir = path.resolve(__dirname, "..");
const REMIX_DIR = path.join(coreDir, "node_modules/remixicon/icons");
const ANTD_DIR = path.join(coreDir, "node_modules/@ant-design/icons-svg/lib/asn");
const OUT_DIR = path.join(coreDir, "src/components");

const EXISTING_REMIX_NAMES = new Set([
  "ChevronDownIcon", "ChevronRightIcon", "ChevronLeftIcon", "MicIcon", "StopCircleIcon", "SendPlaneIcon",
  "CopyIcon", "DeleteIcon", "MoveIcon", "DownloadIcon", "MoreIcon", "LockIcon", "UnlockIcon", "SearchIcon",
  "ErrorWarningIcon", "WifiOffIcon", "TimeIcon", "CloseIcon", "HomeIcon", "FolderIcon", "SettingsIcon",
  "QuestionIcon", "DashboardIcon", "LineChartIcon", "ChatIcon", "TeamIcon", "TaskIcon", "CreditCardIcon", "CalendarIcon",
]);
const EXISTING_ANTD_NAMES = new Set(["EnterOutlined", "InboxOutlined"]);

function toPascalCase(base) {
  const words = base.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  let out = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  if (/^[0-9]/.test(out)) out = "N" + out;
  return out;
}

// Strips a trailing numeric variant suffix for cross-source dedup matching only — never used for
// the actual export name (each numbered variant keeps its own distinct name, e.g. Settings2Icon).
function normalizeKey(base) {
  return base.toLowerCase().replace(/-?\d+$/, "").replace(/[^a-z0-9]+/g, "");
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

// ---- Collect RemixIcon (prefer "-line", fall back to "-fill") ----
const remixFiles = execSync(`find "${REMIX_DIR}" -iname "*.svg"`).toString().trim().split("\n");
const remixByBase = new Map();
for (const f of remixFiles) {
  const filename = path.basename(f, ".svg");
  const m = filename.match(/^(.*)-(line|fill)$/);
  if (!m) continue;
  const [, base, style] = m;
  const existing = remixByBase.get(base);
  if (!existing || (existing.style === "fill" && style === "line")) {
    remixByBase.set(base, { file: f, style, base });
  }
}

const remixIcons = [];
const usedExportNames = new Set(EXISTING_REMIX_NAMES);
for (const [base, info] of remixByBase) {
  const content = fs.readFileSync(info.file, "utf8");
  const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
  const pathMatch = content.match(/<path d="([^"]+)"/);
  if (!viewBoxMatch || !pathMatch) continue;
  const exportName = toPascalCase(base) + "Icon";
  if (EXISTING_REMIX_NAMES.has(exportName)) continue;
  let finalName = exportName;
  let n = 2;
  while (usedExportNames.has(finalName)) finalName = exportName + n++;
  usedExportNames.add(finalName);
  remixIcons.push({ exportName: finalName, key: normalizeKey(base), viewBox: viewBoxMatch[1], d: pathMatch[1] });
}

// ---- Collect Ant Design (Outlined theme only), dropping RemixIcon dupes ----
const remixKeys = new Set(remixIcons.map((i) => i.key));
for (const name of EXISTING_REMIX_NAMES) remixKeys.add(normalizeKey(name.replace(/Icon$/, "")));

const antdFiles = fs.readdirSync(ANTD_DIR).filter((f) => f.endsWith("Outlined.js"));
const antdIcons = [];
let skippedDupes = 0;
let skippedParse = 0;
for (const file of antdFiles) {
  const exportName = path.basename(file, ".js");
  if (EXISTING_ANTD_NAMES.has(exportName)) continue;
  const key = normalizeKey(exportName.replace(/Outlined$/, ""));
  if (remixKeys.has(key)) {
    skippedDupes++;
    continue;
  }
  const content = fs.readFileSync(path.join(ANTD_DIR, file), "utf8");
  const match = content.match(/var \w+ = (\{[\s\S]*\});/);
  if (!match) {
    skippedParse++;
    continue;
  }
  let obj;
  try {
    obj = eval("(" + match[1] + ")");
  } catch {
    skippedParse++;
    continue;
  }
  const viewBox = obj.icon.attrs?.viewBox || "0 0 1024 1024";
  const children = obj.icon.children || [];
  const paths = [];
  let ok = children.length > 0;
  for (const c of children) {
    if (c.tag !== "path") {
      ok = false;
      break;
    }
    const spec = { d: c.attrs.d };
    if (c.attrs["fill-rule"]) spec.fillRule = c.attrs["fill-rule"];
    if (c.attrs["fill-opacity"] !== undefined) spec.fillOpacity = c.attrs["fill-opacity"];
    paths.push(spec);
  }
  if (!ok) {
    skippedParse++;
    continue;
  }
  antdIcons.push({ exportName, viewBox, paths });
}

// ---- Emit icons-remix.tsx ----
let remixOut = `// GENERATED FILE — do not hand-edit. Regenerate via \`pnpm --filter rebar-ui run generate:icons\`
// (see that script and icons.tsx's own doc comment for the source/dedup rules). Real path data
// pulled directly from the \`remixicon\` npm package (Apache License 2.0), "-line" style preferred,
// "-fill" only where an icon ships no line variant. Icons already hand-picked in icons.tsx are
// deliberately excluded here — see EXISTING_REMIX_NAMES in the generator.
import { createIcon } from "./iconFactory";

`;
for (const icon of remixIcons) {
  const vb = icon.viewBox === "0 0 24 24" ? "" : `, "${icon.viewBox}"`;
  remixOut += `export const ${icon.exportName} = createIcon(\n  \`${esc(icon.d)}\`,\n  "${icon.exportName}"${vb},\n);\n\n`;
}
fs.writeFileSync(path.join(OUT_DIR, "icons-remix.tsx"), remixOut);

// ---- Emit icons-antd.tsx ----
let antdOut = `// GENERATED FILE — do not hand-edit. Regenerate via \`pnpm --filter rebar-ui run generate:icons\`
// (see that script and icons.tsx's own doc comment for the source/dedup rules). Real path data
// pulled directly from \`@ant-design/icons-svg\` (MIT License), Outlined theme only. Icons that
// duplicate an existing RemixIcon shape (by normalized name) are deliberately excluded — RemixIcon
// wins on any real overlap, per icons.tsx's own doc comment.
import { createIcon } from "./iconFactory";

`;
for (const icon of antdIcons) {
  const single = icon.paths.length === 1 && !icon.paths[0].fillRule && icon.paths[0].fillOpacity === undefined;
  const pathsLiteral = single
    ? `\`${esc(icon.paths[0].d)}\``
    : "[\n" +
      icon.paths
        .map((p) => {
          const parts = [`d: \`${esc(p.d)}\``];
          if (p.fillRule) parts.push(`fillRule: "${p.fillRule}"`);
          if (p.fillOpacity !== undefined) parts.push(`fillOpacity: ${p.fillOpacity}`);
          return `    { ${parts.join(", ")} },`;
        })
        .join("\n") +
      "\n  ]";
  antdOut += `export const ${icon.exportName} = createIcon(\n  ${pathsLiteral},\n  "${icon.exportName}",\n  "${icon.viewBox}",\n);\n\n`;
}
fs.writeFileSync(path.join(OUT_DIR, "icons-antd.tsx"), antdOut);

console.log(`RemixIcon: ${remixByBase.size} unique bases -> ${remixIcons.length} generated (${EXISTING_REMIX_NAMES.size} already hand-picked, skipped)`);
console.log(`Ant Design Outlined: ${antdFiles.length} total -> ${antdIcons.length} generated (${skippedDupes} dropped as RemixIcon dupes, ${skippedParse} skipped as unsupported, ${EXISTING_ANTD_NAMES.size} already hand-picked)`);
console.log("Wrote icons-remix.tsx and icons-antd.tsx — rebuild, test, and typecheck before committing.");
