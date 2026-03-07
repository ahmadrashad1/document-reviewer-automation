# Complete Setup Guide

This guide walks you through setting up and testing the entire AI Document Analysis system.

## Prerequisites

All services should be running:
- ✅ Ollama (port 11434)
- ✅ Chroma (port 8000)  
- ✅ n8n (port 5678)
- ✅ Backend (port 5000)
- ✅ Frontend (port 3000)

## Part 1: Service Setup

### Step 1: Start Ollama

```bash
ollama serve
```

In a separate terminal, pull required models (first time only):
```bash
ollama pull nomic-embed-text
ollama pull llama3.1
```

### Step 2: Start Chroma

```bash
# Navigate to n8n directory
cd n8n

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install chromadb (if not already installed)
pip install chromadb

# Start Chroma server
chroma run --host localhost --port 8000
```

### Step 3: Start n8n

```bash
n8n start
```

Access n8n at: http://localhost:5678

**Important:** Make sure your workflow is:
- ✅ Saved
- ✅ Activated (toggle ON)

## Part 2: Create Chroma Collection (One-Time Setup)

### Option A: Using Python Script (Recommended)

```bash
# From project root
python setup_chroma.py
```

Or using the venv Python:
```bash
n8n\venv\Scripts\python.exe setup_chroma.py
```

### Option B: Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:8000/api/v1/collections`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "name": "documents"
   }
   ```
5. Click **Send**

**Expected Response:**
```json
{
  "id": "some-uuid",
  "name": "documents",
  "metadata": null
}
```

### Option C: Using Python Client (Interactive)

```python
import chromadb

client = chromadb.HttpClient(host='localhost', port=8000)

# Check existing collections
collections = client.list_collections()
print([c.name for c in collections])

# Create collection if it doesn't exist
if 'documents' not in [c.name for c in collections]:
    collection = client.create_collection(name="documents")
    print(f"Created collection: {collection.name}")
else:
    print("Collection 'documents' already exists")
```

### Verify Collection Exists

**Using Postman:**
- **Method:** GET
- **URL:** `http://localhost:8000/api/v1/collections`
- Click **Send**

**Expected Response:**
```json
[
  {
    "name": "documents",
    "id": "...",
    "metadata": null
  }
]
```

## Part 3: Get Your n8n Webhook URL

1. Open n8n: http://localhost:5678
2. Open your workflow
3. Click on the **Webhook** node
6. Verify that the node is set to receive JSON and its subsequent "function" node references `{{$json.text}}` (not `documentText`).
   - The backend now extracts the PDF to plain text and sends it as `{ "text": "...", "query": "..." }`.
   - Older workflows may also honor `documentText` but using `text` ensures compatibility.
7. Copy the **Production URL**

It will look like:
```
http://localhost:5678/webhook/document-analysis
```

## Part 4: Test Full Workflow

### Option A: Using PowerShell Script

```powershell
.\test-workflow.ps1
```

Enter your webhook URL when prompted.

### Option B: Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:5678/webhook/document-analysis` (your webhook URL)
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "documentText": "The company faces liquidity risks and declining revenue. There are also regulatory concerns.",
     "query": "Find financial risks"
   }
   ```
5. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "extractedSections": [
      {
        "text": "...",
        "reason": "..."
      }
    ],
    "executiveSummary": "...",
    "confidenceScore": 85
  }
}
```

### Option C: Using Frontend

1. Open http://localhost:3000
2. Upload a PDF document
3. Enter your question
4. Click "Analyze Document"
5. View results. The frontend will display either a plain text answer from n8n or an object with fields (e.g. `answer`, `response`, etc.).

> **Note:** The frontend posts the PDF and query to `/analyze`. The backend converts the PDF to text, forwards it to n8n, receives the text response (via `{{ $json.answer }}`), and returns it to the UI.

## Part 5: Health Check

Run the comprehensive health check:

```powershell
.\health-check.ps1
```

Or manually check each service:

```powershell
# Check Ollama
Invoke-WebRequest -Uri http://localhost:11434/api/tags -UseBasicParsing

# Check Chroma
Invoke-WebRequest -Uri http://localhost:8000/api/v1/collections -UseBasicParsing

# Check n8n
Invoke-WebRequest -Uri http://localhost:5678 -UseBasicParsing

# Check Backend
Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing

# Check Frontend
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing
```

## Troubleshooting

### If Postman hangs or times out:

1. ✅ Check if Ollama is running: `http://localhost:11434/api/tags`
2. ✅ Check if Chroma is running: `http://localhost:8000/api/v1/collections`
3. ✅ Check if n8n is running: `http://localhost:5678`

### If you get 404:

1. ✅ Verify webhook path is correct
2. ✅ Ensure workflow is activated in n8n
3. ✅ Check webhook node configuration

### If you get Chroma errors:

1. ✅ Collection may not exist - run `setup_chroma.py`
2. ✅ Check Chroma is running on port 8000
3. ✅ Verify API version compatibility

### If response shows "data": "{...}" (string):

Your n8n workflow final node is missing:
```
JSON.parse($json.response)
```

## Final Execution Order

1. ✅ Start Ollama (`ollama serve`)
2. ✅ Start Chroma (`chroma run --host localhost --port 8000`)
3. ✅ Start n8n (`n8n start`)
4. ✅ Create Chroma collection (one-time: `python setup_chroma.py`)
5. ✅ Get n8n webhook URL
6. ✅ Test workflow via Postman or Frontend

## Quick Reference

| Service | Port | URL | Status Check |
|---------|------|-----|--------------|
| Ollama | 11434 | http://localhost:11434 | `/api/tags` |
| Chroma | 8000 | http://localhost:8000 | `/api/v1/collections` |
| n8n | 5678 | http://localhost:5678 | `/` |
| Backend | 5000 | http://localhost:5000 | `/health` |
| Frontend | 3000 | http://localhost:3000 | `/` |

## Scripts Available

- `setup_chroma.py` - Create Chroma collection
- `health-check.ps1` - Check all services
- `test-workflow.ps1` - Test n8n workflow
- `start-all-services.ps1` - Start all services
- `check-services.ps1` - Quick service status




