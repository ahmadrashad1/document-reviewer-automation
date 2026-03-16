# Start Chroma server for RAG (port 8000)
# Run from project root: .\scripts\start-chroma.ps1
# Uses Docker if available; otherwise tries chromadb via pip (system or n8n venv).

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
$n8nPath = Join-Path $projectRoot "n8n"
$chromaDataPath = Join-Path $n8nPath "chroma"

Write-Host "Chroma server setup (port 8000)..." -ForegroundColor Cyan

# Check if Chroma is already running
try {
    $null = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/heartbeat" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "Chroma is already running on port 8000." -ForegroundColor Green
    exit 0
} catch {}

# Option 1: Docker (preferred)
$dockerOk = $false
try {
    $null = docker info 2>$null
    $dockerOk = $true
} catch {}

if ($dockerOk) {
    if (-not (Test-Path $chromaDataPath)) { New-Item -ItemType Directory -Path $chromaDataPath -Force | Out-Null }
    $chromaDataPathResolved = (Resolve-Path $chromaDataPath).Path
    Write-Host "Starting Chroma via Docker (data: $chromaDataPathResolved)..." -ForegroundColor Green
    docker run -d --name chroma-document-reviewer -p 8000:8000 -v "${chromaDataPathResolved}:/data" chromadb/chroma:latest 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Chroma started. Wait a few seconds then run: python scripts/setup_chroma.py" -ForegroundColor Green
        exit 0
    }
    # Container may already exist; try start
    docker start chroma-document-reviewer 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Chroma container started." -ForegroundColor Green
        exit 0
    }
}

# Option 2: use system chroma if on PATH (from pip install chromadb)
$chromaCmd = Get-Command chroma -ErrorAction SilentlyContinue
if ($chromaCmd) {
    if (-not (Test-Path $chromaDataPath)) { New-Item -ItemType Directory -Path $chromaDataPath -Force | Out-Null }
    Write-Host "Starting Chroma at http://localhost:8000 ..." -ForegroundColor Green
    & chroma run --path $chromaDataPath --port 8000
    exit 0
}

Write-Host "Chroma not found. Options:" -ForegroundColor Yellow
Write-Host "  1. Install Docker and run this script again (recommended)." -ForegroundColor Gray
Write-Host "  2. Or: pip install chromadb  then ensure 'chroma' is on PATH and run: chroma run --path $chromaDataPath --port 8000" -ForegroundColor Gray
exit 1
