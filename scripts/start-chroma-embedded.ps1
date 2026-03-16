# Start embedded Chroma API (no Docker, no separate Chroma server).
# Run from project root: .\scripts\start-chroma-embedded.ps1

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
$chromaDir = Join-Path $projectRoot "chroma-embedded"
$serverPy = Join-Path $chromaDir "server.py"

if (-not (Test-Path $serverPy)) {
    Write-Host "Not found: $serverPy" -ForegroundColor Red
    exit 1
}

$CHROMA_PORT = 8010
$heartbeatUrl = "http://localhost:$CHROMA_PORT/api/v1/heartbeat"

# Check if already running
try {
    $null = Invoke-RestMethod -Uri $heartbeatUrl -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "Chroma embedded is already running on port $CHROMA_PORT." -ForegroundColor Green
    exit 0
} catch {}

# Use venv so chromadb 0.4.x is isolated (avoids conflict with system chromadb 1.x)
$venvPython = Join-Path $chromaDir ".venv\Scripts\python.exe"
$venvPip = Join-Path $chromaDir ".venv\Scripts\pip.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "Creating venv in chroma-embedded..." -ForegroundColor Cyan
    python -m venv (Join-Path $chromaDir ".venv")
}
if (Test-Path $venvPip) {
    Write-Host "Installing/updating chroma-embedded dependencies (venv)..." -ForegroundColor Cyan
    & $venvPip install -r (Join-Path $chromaDir "requirements.txt") -q
}

Write-Host "Starting Chroma embedded at http://localhost:$CHROMA_PORT ..." -ForegroundColor Green
Set-Location $chromaDir
$env:CHROMA_EMBEDDED_PORT = $CHROMA_PORT
if (Test-Path $venvPython) { & $venvPython $serverPy } else { python $serverPy }
