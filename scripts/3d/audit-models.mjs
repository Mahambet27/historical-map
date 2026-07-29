import path from "node:path";
import { fileURLToPath } from "node:url";
import { listModelFiles, readGlbInfo } from "./model-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(scriptDirectory, "../..");
const directories = [
  path.join(workspace, "public/models/source"),
  path.join(workspace, "public/models/exhibition"),
];

const rows = directories.flatMap((directory) =>
  listModelFiles(directory).map((file) => {
    const info = readGlbInfo(file);
    const largest = info.images.reduce(
      (current, image) =>
        image.width * image.height > current.width * current.height ||
        (image.width * image.height === current.width * current.height && image.bytes > current.bytes)
          ? image
          : current,
      { width: 0, height: 0, bytes: 0, mime: "" }
    );
    return {
      file: path.relative(workspace, file),
      sizeMiB: (info.bytes / 1024 / 1024).toFixed(2),
      meshes: info.meshes,
      primitives: info.primitives,
      triangles: info.triangles,
      textures: info.textures,
      largestTexture: `${largest.width}x${largest.height}`,
      textureMiB: (largest.bytes / 1024 / 1024).toFixed(2),
      compression: info.compression.join(",") || "none",
    };
  })
);

console.table(rows);
if (!rows.length) {
  console.error("No models found in public/models/source or public/models/exhibition.");
  process.exitCode = 1;
}
