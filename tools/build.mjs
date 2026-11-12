// Bündelt das Script und packt .mcpack/.mcaddon.
import { build } from "esbuild";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await build({
  entryPoints: [path.join(root, "src/main.ts")],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: path.join(root, "packs/BP/scripts/main.js"),
  external: ["@minecraft/server", "@minecraft/server-ui"],
  legalComments: "none",
  logLevel: "warning",
  banner: { js: "// Chroniken des Weltenbaums – generiert aus src/ (TypeScript). Nicht direkt bearbeiten." },
});
const dist = path.join(root, "dist");
fs.mkdirSync(dist, { recursive: true });
execFileSync("python3", ["-I", path.join(root, "tools/pack.py"), root], { stdio: "inherit" });
