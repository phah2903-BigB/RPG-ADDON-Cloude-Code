// Bündelt den Generator (TypeScript) für Node und führt ihn aus.
import { build } from "esbuild";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await build({ entryPoints: [path.join(root, "tools/gen/index.ts")], bundle: true, platform: "node", format: "cjs", outfile: path.join(root, "build/gen.cjs"), logLevel: "warning" });
execFileSync(process.execPath, [path.join(root, "build/gen.cjs")], { stdio: "inherit", cwd: root });
