# Start Backend Service on port 5000
Write-Host "Starting Backend service on port 5000..." -ForegroundColor Green

$backendPath = Join-Path $PSScriptRoot "ai-doc-backend"

if (-not (Test-Path $backendPath)) {
    Write-Host "Error: Backend directory not found at $backendPath" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

# Check if already running
$existing = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Backend is already running on port 5000" -ForegroundColor Yellow
    exit 0
}

# Start the backend
Write-Host "Starting Node.js backend server..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $backendPath -WindowStyle Normal

Write-Host "Backend service started. Check http://localhost:5000/health to verify." -ForegroundColor Green




