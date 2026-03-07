# Setup Chroma Collection - One-time setup
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chroma Collection Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$chromaUrl = "http://localhost:8000"
$collectionName = "documents"

# Try v1 API first (some versions still use it)
Write-Host "Step 1: Checking if collection exists..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$chromaUrl/api/v1/collections" -Method GET -ContentType "application/json" -ErrorAction Stop
    $existing = $response | Where-Object { $_.name -eq $collectionName }
    
    if ($existing) {
        Write-Host "✅ Collection '$collectionName' already exists!" -ForegroundColor Green
        Write-Host "Collection ID: $($existing.id)" -ForegroundColor Gray
        exit 0
    }
} catch {
    Write-Host "v1 API not available, trying v2..." -ForegroundColor Yellow
}

# Try v2 API
Write-Host "Step 2: Creating collection using v2 API..." -ForegroundColor Yellow
try {
    $body = @{
        name = $collectionName
        metadata = $null
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$chromaUrl/api/v1/collections" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✅ Collection created successfully!" -ForegroundColor Green
    Write-Host "Collection Name: $($response.name)" -ForegroundColor Gray
    Write-Host "Collection ID: $($response.id)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error creating collection:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Alternative: Use curl if available
    $curlCommand = "curl -X POST `"$chromaUrl/api/v1/collections`" -H `"Content-Type: application/json`" -d `'{\"name\":\"$collectionName\"}`'"
    Write-Host "You can also try running this command manually:" -ForegroundColor Cyan
    Write-Host $curlCommand -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 3: Verifying collection exists..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$chromaUrl/api/v1/collections" -Method GET -ContentType "application/json" -ErrorAction Stop
    
    $found = $false
    if ($response -is [array]) {
        $found = $response | Where-Object { $_.name -eq $collectionName }
    } elseif ($response.name -eq $collectionName) {
        $found = $true
    }
    
    if ($found) {
        Write-Host "✅ Verification successful! Collection exists." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Collection not found in list. It may have been created but not listed." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not verify collection, but it may have been created." -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan




