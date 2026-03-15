# Run n8n in Docker with port 5678 published to the host
# Without -p 5678:5678, localhost:5678 will not work (port not exposed).

$containerName = "n8n-document-reviewer"
$image = "n8nio/n8n:latest"

# Optional: persist n8n data on host (workflows, credentials)
$n8nData = "$env:USERPROFILE\.n8n"
if (-not (Test-Path $n8nData)) { New-Item -ItemType Directory -Path $n8nData -Force | Out-Null }

Write-Host "Starting n8n in Docker (port 5678)..." -ForegroundColor Cyan
Write-Host "Editor will be at: http://localhost:5678" -ForegroundColor Green
Write-Host ""

# Remove existing container with same name if present
docker rm -f $containerName 2>$null

docker run -d `
  --name $containerName `
  -p 5678:5678 `
  -v "${n8nData}:/home/node/.n8n" `
  -e N8N_HOST=0.0.0.0 `
  -e N8N_PORT=5678 `
  $image

if ($LASTEXITCODE -eq 0) {
  Write-Host "n8n is running. Open http://localhost:5678 in your browser." -ForegroundColor Green
  docker ps --filter "name=$containerName"
} else {
  Write-Host "Failed to start n8n. Check Docker is running." -ForegroundColor Red
  exit 1
}
