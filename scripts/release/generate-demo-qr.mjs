import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const validateQrUrl = (input) => {
  const url = new URL(input);
  const localNames = new Set(["localhost", "127.0.0.1", "::1"]);
  if (url.protocol !== "https:") throw new Error("QR URL must use HTTPS.");
  if (url.username || url.password) throw new Error("QR URL must not contain credentials.");
  if (localNames.has(url.hostname)) throw new Error("QR generation for localhost is forbidden.");
  if (url.pathname !== "/demo") throw new Error("QR URL must point to production /demo.");
  return url;
};

const parseUrl = (argv = process.argv.slice(2)) => {
  const inline = argv.find((value) => value.startsWith("--url="));
  const index = argv.indexOf("--url");
  return validateQrUrl(inline?.slice(6) || (index >= 0 ? argv[index + 1] : ""));
};

export const generateDemoQr = async ({ url, outputRoot = "release-packages/stable/qr" }) => {
  const base = validateQrUrl(url);
  let QRCode;
  try {
    const optionalPackage = "qrcode";
    QRCode = (await import(optionalPackage)).default;
  } catch {
    await mkdir(outputRoot, { recursive: true });
    await writeFile(
      path.join(outputRoot, "README.txt"),
      `QR assets are pending. Install the optional "qrcode" package and rerun with:\n${base.href}\n`,
      "utf8"
    );
    return { generated: false, reason: "optional_qrcode_dependency_missing" };
  }
  const variants = {
    "demo.png": base.href,
    "demo-light.png": new URL("?quality=light", base).href,
    "demo-kk.png": new URL("?lang=kk", base).href,
    "demo-ru.png": new URL("?lang=ru", base).href,
  };
  await mkdir(outputRoot, { recursive: true });
  for (const [name, value] of Object.entries(variants)) {
    await QRCode.toFile(path.join(outputRoot, name), value, {
      errorCorrectionLevel: "M",
      margin: 4,
      width: 768,
    });
  }
  return { generated: true, files: Object.keys(variants) };
};

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  const result = await generateDemoQr({ url: parseUrl() });
  console.log(JSON.stringify(result, null, 2));
}
