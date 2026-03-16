# Check Service Status
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Backend
Write-Host "Backend (port 5000):" -NoNewline
try {
    $response = Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    $content = $response.Content | ConvertFrom-Json
    Write-Host " ✅ Running" -ForegroundColor Green
    Write-Host "   Status: $($content.status)" -ForegroundColor Gray
} catch {
    Write-Host " ❌ Not responding" -ForegroundColor Red
}

# Check Ollama
Write-Host "Ollama (port 11434):" -NoNewline
try {
    $response = Invoke-WebRequest -Uri http://localhost:11434/api/tags -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    $content = $response.Content | ConvertFrom-Json
    $modelCount = $content.models.Count
    Write-Host " ✅ Running" -ForegroundColor Green
    Write-Host "   Models available: $modelCount" -ForegroundColor Gray
} catch {
    Write-Host " ❌ Not responding" -ForegroundColor Red
}

# Check Chroma
Write-Host "Chroma embedded (port 8010):" -NoNewline
try {
    $response = Invoke-WebRequest -Uri http://localhost:8010/api/v1/heartbeat -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host " ✅ Running" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*deprecated*") {
        Write-Host " ✅ Running (v1 API deprecated, using v2)" -ForegroundColor Green
    } else {
        Write-Host " ❌ Not responding" -ForegroundColor Red
    }
}

# Check n8n (if needed)
Write-Host "n8n:" -NoNewline
Write-Host " (Not checked - user confirmed it's running)" -ForegroundColor Gray

Write-Host ""




