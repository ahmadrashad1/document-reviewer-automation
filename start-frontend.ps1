# Start Frontend Service on port 3000
Write-Host "Starting Frontend service on port 3000..." -ForegroundColor Green

$frontendPath = Join-Path $PSScriptRoot "frontend"

if (-not (Test-Path $frontendPath)) {
    Write-Host "Error: Frontend directory not found at $frontendPath" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check if already running
$existing = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Frontend is already running on port 3000" -ForegroundColor Yellow
    Write-Host "Access it at: http://localhost:3000" -ForegroundColor Cyan
    exit 0
}

# Start the frontend
Write-Host "Starting React development server..." -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
npm run dev




