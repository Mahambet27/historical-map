import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(scriptDirectory, "../..");
const input = path.join(workspace, "public/models/source/bory_tastagan_3d_model.glb");
const output = path.join(workspace, "public/models/exhibition/bory-tastagan.glb");
const cli = path.join(workspace, "node_modules/@gltf-transform/cli/bin/cli.js");

if (!fs.existsSync(input)) {
  throw new Error(`Source model is missing: ${input}`);
}
fs.mkdirSync(path.dirname(output), { recursive: true });

const result = spawnSync(
  process.execPath,
  [
    cli,
    "optimize",
    input,
    output,
    "--compress",
    "meshopt",
    "--meshopt-level",
    "high",
    "--texture-compress",
    "webp",
    "--texture-size",
    "2048",
    "--flatten",
    "false",
    "--join",
    "false",
    "--palette",
    "false",
    "--simplify",
    "false",
    "--prune",
    "true",
    "--weld",
    "true",
  ],
  { cwd: workspace, encoding: "utf8", stdio: "inherit" }
);

if (result.status !== 0) {
  process.exitCode = result.status || 1;
} else {
  const before = fs.statSync(input).size;
  const after = fs.statSync(output).size;
  const reduction = ((1 - after / before) * 100).toFixed(1);
  console.log(`Optimized ${path.basename(input)}: ${before} -> ${after} bytes (${reduction}% smaller).`);
}

