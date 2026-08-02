import { createReadStream, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const requestedRoot = process.env.QHM_DEMO_ROOT || process.argv[2];
const root = path.resolve(requestedRoot || path.join(scriptDir, "dist"));
const requestedPort = Number(process.env.QHM_DEMO_PORT || process.argv[3] || 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
  ".webmanifest": "application/manifest+json",
};

const resolveRequest = (pathname) => {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, "");
  const candidate = path.resolve(root, relative || "index.html");
  if (!candidate.startsWith(`${root}${path.sep}`) && candidate !== root) {
    return null;
  }
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return path.join(root, "index.html");
};

if (!existsSync(path.join(root, "index.html"))) {
  console.error("NOT READY: offline dist/index.html is missing.");
  process.exit(1);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  if (url.pathname === "/__qhm_health") {
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end(
      JSON.stringify({ status: "READY", service: "qazaq-heritage-demo" })
    );
    return;
  }
  const file = resolveRequest(url.pathname);
  if (!file) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const stats = statSync(file);
    response.writeHead(200, {
      "content-type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
      "content-length": stats.size,
      "x-content-type-options": "nosniff",
      "cache-control":
        path.basename(file) === "index.html"
          ? "no-cache"
          : "public, max-age=31536000, immutable",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end(await readFile(path.join(root, "offline.html"), "utf8").catch(() => "Not found"));
  }
});

server.on("error", (error) => {
  console.error(`NOT READY: ${error.code || "server error"}`);
  process.exit(1);
});

server.listen(requestedPort, "127.0.0.1", () => {
  const address = server.address();
  console.log(`READY http://127.0.0.1:${address.port}/demo?kiosk=true`);
});

const stop = () => server.close(() => process.exit(0));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

