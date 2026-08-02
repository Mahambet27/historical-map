$ErrorActionPreference = "SilentlyContinue"
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
