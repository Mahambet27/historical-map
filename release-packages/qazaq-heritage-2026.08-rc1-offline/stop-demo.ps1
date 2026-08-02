$ErrorActionPreference = "Stop"
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
