# Fix for Ollama Connection Error in n8n

## Problem

Error: `ECONNREFUSED ::1:11434`

This happens because:
- Ollama is listening on **IPv4** (`127.0.0.1:11434`)
- n8n is trying to connect via **IPv6** (`::1:11434`)
- Windows resolves `localhost` to IPv6 first, causing the connection to fail

## Solution

### Option 1: Use 127.0.0.1 instead of localhost (Recommended)

In your n8n HTTP Request node, change the URL from:
```
http://localhost:11434/api/embeddings
```

To:
```
http://127.0.0.1:11434/api/embeddings
```

### Option 2: Configure Ollama to listen on all interfaces

Restart Ollama with:
```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Or set the environment variable:
- Windows: `set OLLAMA_HOST=0.0.0.0:11434`
- Then run: `ollama serve`

## Correct Request Format

### URL
```
http://127.0.0.1:11434/api/embeddings
```

### Method
```
POST
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "model": "nomic-embed-text",
  "prompt": "Your text to embed here"
}
```

### Expected Response
```json
{
  "embedding": [0.123, -0.456, ...]
}
```

## Testing the Fix

You can test the endpoint directly:

**PowerShell:**
```powershell
$body = @{
    model = "nomic-embed-text"
    prompt = "test text"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/embeddings" -Method POST -Body $body -ContentType "application/json"
```

**cURL:**
```bash
curl http://127.0.0.1:11434/api/embeddings -d '{"model":"nomic-embed-text","prompt":"test text"}'
```

## Additional Notes

1. **Model must be pulled first:**
   ```bash
   ollama pull nomic-embed-text
   ```

2. **Verify Ollama is running:**
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```

3. **If using Docker:**
   - Use `host.docker.internal:11434` instead of `localhost:11434`
   - Or use the host's IP address

## Quick Fix Summary

**Change this in your n8n HTTP Request node:**
- ❌ `http://localhost:11434/api/embeddings`
- ✅ `http://127.0.0.1:11434/api/embeddings`

This will force n8n to use IPv4, which matches where Ollama is listening.




