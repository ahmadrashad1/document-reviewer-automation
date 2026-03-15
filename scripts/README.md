# Scripts

Run these from the **project root** (parent of `scripts/`).

| Script | Purpose |
|--------|---------|
| `start-n8n-docker.ps1` | Run n8n in Docker with port 5678 published. |
| `health-check.ps1` | Check that backend, frontend, n8n (and optionally Ollama, Chroma) are reachable. |
| `test-workflow.ps1` | POST a test payload to the n8n webhook (prompts for URL). |
| `start-backend.ps1` | Start the Express backend (port 5000). |
| `start-frontend.ps1` | Start the Vite frontend (port 3000). |
| `start-all-services.ps1` | Start backend, n8n, and frontend in separate windows (local Node, not Docker). |
| `start-chroma.ps1` | Start Chroma server (for RAG). |
| `start-ollama.ps1` | Start Ollama (optional local LLM). |
| `setup-chroma-collection.ps1` | Create the Chroma `documents` collection (PowerShell). |
| `check-services.ps1` | Quick status of services. |
| `setup_chroma.py` | Create the Chroma `documents` collection (Python). Run: `python scripts/setup_chroma.py`. |

Example (from project root):

```powershell
.\scripts\start-n8n-docker.ps1
.\scripts\health-check.ps1
.\scripts\test-workflow.ps1
```
