# Portable Python/GDAL, entirely inside the ignored terrain workspace.
$ErrorActionPreference = 'Stop'
$terrainRoot = Join-Path $PSScriptRoot '../../.maps-data/terrain/tools'
New-Item -ItemType Directory -Force $terrainRoot | Out-Null
$terrainRoot = (Resolve-Path $terrainRoot).Path
$runtime = Join-Path $terrainRoot 'runtime'
New-Item -ItemType Directory -Force $runtime | Out-Null
$env:TEMP = $terrainRoot
$env:TMP = $terrainRoot
$env:PYTHONUTF8 = '1'

function Get-VerifiedFile($Url, $File, $Hash) {
    if (-not (Test-Path -LiteralPath $File)) {
        & curl.exe --fail --silent --show-error --location --retry 3 $Url --output $File
        if ($LASTEXITCODE -ne 0) { throw "Download failed: $Url" }
    }
    if ((Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash -ne $Hash) {
        throw "Checksum mismatch: $File"
    }
}
Get-VerifiedFile 'https://www.python.org/ftp/python/3.12.10/python-3.12.10-embed-amd64.zip' (Join-Path $terrainRoot 'python-3.12.10.zip') '4ACBED6DD1C744B0376E3B1CF57CE906F9DC9E95E68824584C8099A63025A3C3'
if (-not (Test-Path -LiteralPath (Join-Path $runtime 'python.exe'))) {
    & tar.exe -xf (Join-Path $terrainRoot 'python-3.12.10.zip') -C $runtime
    if ($LASTEXITCODE -ne 0) { throw 'Python extraction failed' }
}
Set-Content -Encoding ASCII (Join-Path $runtime 'python312._pth') "python312.zip`n.`nLib/site-packages`nimport site"
$python = Join-Path $runtime 'python.exe'
& $python -m pip --version 2>$null
if ($LASTEXITCODE -ne 0) {
    & curl.exe --fail --silent --show-error --location https://bootstrap.pypa.io/get-pip.py --output (Join-Path $terrainRoot 'get-pip.py')
    if ($LASTEXITCODE -ne 0) { throw 'pip bootstrap download failed' }
    & $python (Join-Path $terrainRoot 'get-pip.py') --no-cache-dir 'pip==26.2.1'
    if ($LASTEXITCODE -ne 0) { throw 'pip bootstrap failed' }
}
$wheel = Join-Path $terrainRoot 'gdal-3.13.3-cp312-cp312-win_amd64.whl'
Get-VerifiedFile 'https://github.com/cgohlke/geospatial-wheels/releases/download/v2026.8.20/gdal-3.13.3-cp312-cp312-win_amd64.whl' $wheel 'cedfaf6016d981926dc05fcc78dc9586fc2c293859be5109faac52446aa8964e'
& $python -m pip install --no-cache-dir 'numpy==2.5.3' $wheel
if ($LASTEXITCODE -ne 0) { throw 'GDAL installation failed' }
& $python -c "from osgeo import gdal; import numpy; print('GDAL', gdal.VersionInfo(), 'numpy', numpy.__version__)"
exit $LASTEXITCODE
