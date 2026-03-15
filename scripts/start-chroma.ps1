# Start Chroma Service on port 8000
Write-Host "Starting Chroma service on port 8000..." -ForegroundColor Green

$chromaPath = Join-Path $PSScriptRoot "n8n"
$venvPython = Join-Path $chromaPath "venv\Scripts\python.exe"
$chromaExe = Join-Path $chromaPath "venv\Scripts\chroma.exe"

# Check if already running
$existing = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Chroma is already running on port 8000" -ForegroundColor Yellow
    exit 0
}

# Check if Chroma is installed
if (-not (Test-Path $chromaExe)) {
    Write-Host "Chroma executable not found. Installing Chroma..." -ForegroundColor Yellow
    Set-Location $chromaPath
    
    if (Test-Path $venvPython) {
        & $venvPython -m pip install chromadb
    } else {
        Write-Host "Error: Python virtual environment not found at $venvPython" -ForegroundColor Red
        exit 1
    }
}

# Start Chroma server
Write-Host "Starting Chroma server..." -ForegroundColor Cyan
Set-Location $chromaPath
$chromaDataPath = Join-Path $chromaPath "chroma"
Start-Process -FilePath $chromaExe -ArgumentList "run", "--path", $chromaDataPath, "--port", "8000" -WindowStyle Normal

Write-Host "Chroma service started. Check http://localhost:8000 to verify." -ForegroundColor Green




