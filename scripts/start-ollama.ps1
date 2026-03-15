# Start Ollama Service on port 11434
Write-Host "Starting Ollama service on port 11434..." -ForegroundColor Green

# Check if already running
$existing = Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Ollama is already running on port 11434" -ForegroundColor Yellow
    exit 0
}

# Check if Ollama is installed
$ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaPath) {
    Write-Host "Ollama is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Ollama from https://ollama.ai" -ForegroundColor Yellow
    exit 1
}

# Start Ollama service
Write-Host "Starting Ollama server..." -ForegroundColor Cyan
Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Normal

Write-Host "Ollama service started. Check http://localhost:11434/api/tags to verify." -ForegroundColor Green




