$ErrorActionPreference = "Stop"
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
