import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const local = fileURLToPath(
  new URL("../../.maps-data/terrain/tools/runtime/python.exe", import.meta.url)
);
const executable = fs.existsSync(local) ? local : "python";
let data = path.join(path.dirname(local), "Lib/site-packages/osgeo/data");
if (process.platform === "win32" && fs.existsSync(data)) {
  const short = spawnSync("cmd.exe", ["/d", "/c", "for %I in (.) do @echo %~sI"], {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    encoding: "utf8",
  });
  if (short.status === 0)
    data = path.join(
      short.stdout.trim(),
      ".maps-data/terrain/tools/runtime/Lib/site-packages/osgeo/data"
    );
}
const result = spawnSync(executable, process.argv.slice(2), {
  stdio: "inherit",
  env: {
    ...process.env,
    PYTHONUTF8: "1",
    ...(fs.existsSync(data)
      ? { PROJ_DATA: path.join(data, "proj"), GDAL_DATA: path.join(data, "gdal") }
      : {}),
  },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
