import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  offlinePackageDir,
  offlinePackageName,
  repoRoot,
  releaseVersion,
  shouldExcludePackagePath,
} from "./package-config.mjs";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const runBuild = () => {
  const result = spawnSync(npm, ["run", "build"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_RELEASE_CHANNEL: "exhibition-stable",
      VITE_OFFLINE_EXHIBITION: "true",
      VITE_HISTORICAL_DATA_SOURCE: "local",
      VITE_MAPBOX_TOKEN: "",
    },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) throw new Error("Offline production build failed");
};

const copyFiltered = async (source, destination, root = source) => {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const absolute = path.join(source, entry.name);
    const relative = path.relative(root, absolute);
    if (
      shouldExcludePackagePath(relative) ||
      relative.startsWith(`images${path.sep}`) ||
      relative.startsWith(`archive-maps${path.sep}`)
    ) {
      continue;
    }
    const target = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyFiltered(absolute, target, root);
    else if (entry.isFile()) await cp(absolute, target);
  }
};

const readDoc = async (name, fallback) =>
  readFile(path.join(repoRoot, "docs", name), "utf8").catch(() => fallback);

const launchers = {
  "start-demo.ps1": String.raw`$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Write-Host "NOT READY: Node.js is required."; exit 1 }
$port = 4173
while ($port -lt 4200) {
  $busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $busy) { break }
  $port++
}
if ($port -ge 4200) { Write-Host "NOT READY: No free local port."; exit 1 }
$process = Start-Process -FilePath $node.Source -ArgumentList @("$root\serve-offline-demo.mjs", "$root\dist", "$port") -WindowStyle Hidden -PassThru
@{ pid = $process.Id; port = $port; service = "qazaq-heritage-demo" } | ConvertTo-Json | Set-Content -LiteralPath "$root\.demo-server.json" -Encoding UTF8
Start-Sleep -Milliseconds 700
Start-Process "http://127.0.0.1:$port/demo?kiosk=true"
Write-Host "READY: http://127.0.0.1:$port/demo?kiosk=true"
`,
  "stop-demo.ps1": String.raw`$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$statePath = "$root\.demo-server.json"
if (-not (Test-Path -LiteralPath $statePath)) { Write-Host "NOT READY: Demo server is not running."; exit 0 }
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$process = Get-CimInstance Win32_Process -Filter "ProcessId=$($state.pid)" -ErrorAction SilentlyContinue
if ($process -and $process.Name -match "^node" -and $process.CommandLine -like "*serve-offline-demo.mjs*") {
  Stop-Process -Id $state.pid
}
Remove-Item -LiteralPath $statePath -Force
Write-Host "READY: Demo server stopped."
`,
  "check-demo.ps1": String.raw`$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$statePath = "$root\.demo-server.json"
$manifestPath = "$root\release-manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath)) { Write-Host "NOT READY: release manifest missing."; exit 1 }
if (-not (Test-Path -LiteralPath "$root\dist\offline.html")) { Write-Host "NOT READY: offline shell missing."; exit 1 }
if (-not (Test-Path -LiteralPath $statePath)) { Write-Host "NOT READY: server state missing."; exit 1 }
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$health = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$($state.port)/__qhm_health" -TimeoutSec 3
$demo = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$($state.port)/demo" -TimeoutSec 3
if ($health.StatusCode -eq 200 -and $demo.StatusCode -eq 200) { Write-Host "READY"; exit 0 }
Write-Host "DEGRADED"; exit 2
`,
  "start-demo.cmd": `@echo off\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-demo.ps1"\r\n`,
};

const emergencyHtml = `<!doctype html>
<html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Qazaq Heritage Map — аварийная карточка</title>
<style>body{font:16px/1.45 system-ui;margin:30px;color:#102630}h1{border-bottom:3px solid #b38436}section{break-inside:avoid;margin:15px 0}h2{font-size:18px} @media print{body{margin:12mm;font-size:12px}}</style>
<h1>Аварийная карточка · ${releaseVersion}</h1>
<section><h2>Карта зависла</h2><ol><li>Нажмите Ctrl+Shift+O.</li><li>Выберите Reset to 1465.</li><li>Если меню недоступно — перезапустите браузер.</li></ol></section>
<section><h2>3D или Mapbox не загрузились</h2><ol><li>Закройте 3D.</li><li>В operator menu включите SVG fallback.</li><li>Продолжайте основной сценарий.</li></ol></section>
<section><h2>Интернет пропал или интерфейс медленный</h2><ol><li>Включите Light mode.</li><li>Используйте локальный SVG fallback.</li><li>Не перезапускайте сервер без необходимости.</li></ol></section>
<section><h2>Старая версия / перезапуск компьютера</h2><ol><li>Запустите start-demo.cmd.</li><li>При старом кеше откройте /demo?recovery=true.</li><li>Подтвердите восстановление только кеша проекта.</li></ol></section>
</html>`;

export const buildOfflineExhibition = async ({ skipBuild = false } = {}) => {
  if (!skipBuild) runBuild();
  await rm(offlinePackageDir, { recursive: true, force: true });
  await mkdir(path.join(offlinePackageDir, "operator"), { recursive: true });
  await mkdir(path.join(offlinePackageDir, "reports"), { recursive: true });
  await copyFiltered(
    path.join(repoRoot, "dist"),
    path.join(offlinePackageDir, "dist")
  );
  await cp(
    path.join(repoRoot, "scripts", "release", "serve-offline-demo.mjs"),
    path.join(offlinePackageDir, "serve-offline-demo.mjs")
  );
  for (const [name, content] of Object.entries(launchers)) {
    await writeFile(path.join(offlinePackageDir, name), content, "utf8");
  }
  const guides = [
    ["P2A8_OPERATOR_GUIDE_RU.md", "README_RU.txt"],
    ["P2A8_OPERATOR_GUIDE_KK.md", "README_KK.txt"],
    ["P2A8_OPERATOR_GUIDE_EN.md", "README_EN.txt"],
  ];
  for (const [source, target] of guides) {
    await writeFile(
      path.join(offlinePackageDir, target),
      await readDoc(source, `Qazaq Heritage Map ${releaseVersion}\n`),
      "utf8"
    );
  }
  await writeFile(
    path.join(offlinePackageDir, "operator", "emergency-card.html"),
    emergencyHtml,
    "utf8"
  );
  const sourceRelease = JSON.parse(
    await readFile(path.join(repoRoot, "public", "exhibition-release.json"), "utf8")
  );
  const releaseManifest = {
    ...sourceRelease,
    packageType: "offline-exhibition",
    releaseVersion,
    packageName: offlinePackageName,
    repositoryMode: "local",
    offline: true,
    noSecrets: true,
  };
  await writeFile(
    path.join(offlinePackageDir, "release-manifest.json"),
    `${JSON.stringify(releaseManifest, null, 2)}\n`,
    "utf8"
  );
  await cp(
    path.join(repoRoot, "public", "exhibition-preflight.json"),
    path.join(offlinePackageDir, "reports", "exhibition-preflight.json")
  );
  const files = await readdir(path.join(offlinePackageDir, "dist"), {
    recursive: true,
  });
  const forbidden = files.filter((file) => shouldExcludePackagePath(file));
  if (forbidden.length) {
    throw new Error(`Forbidden package files: ${forbidden.join(", ")}`);
  }
  const size = (
    await Promise.all(
      files.map(async (file) => {
        const target = path.join(offlinePackageDir, "dist", file);
        return (await stat(target)).isFile() ? (await stat(target)).size : 0;
      })
    )
  ).reduce((total, value) => total + value, 0);
  console.log(
    `Offline exhibition package: ${offlinePackageDir} (${(size / 1024 / 1024).toFixed(2)} MiB)`
  );
  return { directory: offlinePackageDir, bytes: size };
};

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  buildOfflineExhibition().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
