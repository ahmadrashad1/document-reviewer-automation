# Test Full Workflow via n8n Webhook
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Workflow Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$n8nWebhookUrl = Read-Host "Enter your n8n webhook URL (e.g., http://localhost:5678/webhook/document-analysis)"
if ([string]::IsNullOrWhiteSpace($n8nWebhookUrl)) {
    Write-Host "❌ Webhook URL is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Testing webhook connection..." -ForegroundColor Yellow

# Test data
$testData = @{
    text = "The company faces liquidity risks and declining revenue. There are also regulatory concerns. The financial statements show a significant decrease in cash flow over the past quarter."
    query = "Find financial risks"
} | ConvertTo-Json

try {
    Write-Host "Sending test request to: $n8nWebhookUrl" -ForegroundColor Gray
    Write-Host "Payload:" -ForegroundColor Gray
    Write-Host $testData -ForegroundColor DarkGray
    Write-Host ""
    
    $response = Invoke-RestMethod -Uri $n8nWebhookUrl -Method POST -Body $testData -ContentType "application/json" -TimeoutSec 300
    
    Write-Host "✅ Request successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
    
    # if the response is just text, treat as success
    if ($response -is [string] -or $response.success) {
        Write-Host "";
        Write-Host "✅ Full workflow test PASSED!" -ForegroundColor Green
    } else {
        Write-Host "";
        Write-Host "⚠️  Workflow completed but response indicates failure" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Request failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "1. Check if n8n is running: http://localhost:5678" -ForegroundColor Gray
    Write-Host "2. Verify webhook URL is correct" -ForegroundColor Gray
    Write-Host "3. Ensure workflow is activated in n8n" -ForegroundColor Gray
    Write-Host "4. Check if Ollama and Chroma are running" -ForegroundColor Gray
}




