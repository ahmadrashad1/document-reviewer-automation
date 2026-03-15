# Comprehensive Health Check for All Services
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "System Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allHealthy = $true

# Check Ollama
Write-Host "1. Ollama (port 11434)..." -NoNewline -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 3 -ErrorAction Stop
    $modelCount = $response.models.Count
    Write-Host " ✅ Running" -ForegroundColor Green
    Write-Host "   Models available: $modelCount" -ForegroundColor Gray
    if ($modelCount -eq 0) {
        Write-Host "   ⚠️  Warning: No models found. Run: ollama pull llama3.1" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ❌ Not running" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    $allHealthy = $false
}

# Check Chroma
Write-Host "2. Chroma (port 8000)..." -NoNewline -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/collections" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host " ✅ Running" -ForegroundColor Green
    $collections = if ($response -is [array]) { $response } else { @($response) }
    $documentsCollection = $collections | Where-Object { $_.name -eq "documents" }
    if ($documentsCollection) {
        Write-Host "   Collection 'documents': ✅ Exists" -ForegroundColor Green
    } else {
        Write-Host "   Collection 'documents': ❌ Not found" -ForegroundColor Red
        Write-Host "   Run: .\setup-chroma-collection.ps1" -ForegroundColor Yellow
        $allHealthy = $false
    }
} catch {
    if ($_.Exception.Message -like "*410*" -or $_.Exception.Message -like "*deprecated*") {
        Write-Host " ✅ Running (v1 API deprecated)" -ForegroundColor Green
        Write-Host "   ⚠️  Note: Using deprecated API, collection check skipped" -ForegroundColor Yellow
    } else {
        Write-Host " ❌ Not running" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        $allHealthy = $false
    }
}

# Check n8n
Write-Host "3. n8n (port 5678)..." -NoNewline -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host " ✅ Running" -ForegroundColor Green
    Write-Host "   Access at: http://localhost:5678" -ForegroundColor Gray
} catch {
    Write-Host " ❌ Not running" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    $allHealthy = $false
}

# Check Backend
Write-Host "4. Backend (port 5000)..." -NoNewline -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host " ✅ Running" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host " ❌ Not running" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    $allHealthy = $false
}

# Check Frontend
Write-Host "5. Frontend (port 3000)..." -NoNewline -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host " ✅ Running" -ForegroundColor Green
    Write-Host "   Access at: http://localhost:3000" -ForegroundColor Gray
} catch {
    Write-Host " ⚠️  Not running (optional)" -ForegroundColor Yellow
    Write-Host "   Start with: cd frontend && npm run dev" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "✅ All critical services are healthy!" -ForegroundColor Green
} else {
    Write-Host "❌ Some services need attention" -ForegroundColor Red
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Start missing services" -ForegroundColor Gray
    Write-Host "2. Run setup scripts if needed" -ForegroundColor Gray
    Write-Host "3. Re-run this health check" -ForegroundColor Gray
}
Write-Host "========================================" -ForegroundColor Cyan




