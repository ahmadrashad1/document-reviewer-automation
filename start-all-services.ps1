# Start All Services Script
Write-Host "`n=== Starting Full Stack Services ===" -ForegroundColor Cyan
Write-Host ""

# Stop any existing Node processes
Write-Host "Stopping existing Node processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend (port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\automationChallenge2\ai-doc-backend; Write-Host 'Backend Server Starting...' -ForegroundColor Cyan; npm start"

Start-Sleep -Seconds 3

# Start n8n
Write-Host "Starting n8n (port 5678)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\automationChallenge2\n8n; Write-Host 'n8n Starting...' -ForegroundColor Cyan; npx n8n"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend (port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\automationChallenge2\frontend; Write-Host 'Frontend Starting...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "All services started in separate windows." -ForegroundColor Green
Write-Host "Please check the PowerShell windows for any errors." -ForegroundColor Yellow
Write-Host ""
Write-Host "Waiting 30 seconds for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "=== Service Status Check ===" -ForegroundColor Cyan
Write-Host ""

# Check Backend
Write-Host "Backend (http://localhost:5000): " -NoNewline
try {
    $r = Invoke-RestMethod -Uri http://localhost:5000/health -TimeoutSec 3
    Write-Host "✅ RUNNING - $($r.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ NOT RUNNING" -ForegroundColor Red
}

# Check n8n
Write-Host "n8n (http://localhost:5678): " -NoNewline
try {
    $r = Invoke-WebRequest -Uri http://localhost:5678 -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ RUNNING" -ForegroundColor Green
} catch {
    Write-Host "❌ NOT RUNNING" -ForegroundColor Red
}

# Check Frontend
Write-Host "Frontend (http://localhost:3000): " -NoNewline
try {
    $r = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ RUNNING" -ForegroundColor Green
} catch {
    Write-Host "❌ NOT RUNNING" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Access URLs ===" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000/health" -ForegroundColor White
Write-Host "n8n:      http://localhost:5678" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
