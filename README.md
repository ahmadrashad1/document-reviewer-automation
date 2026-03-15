# AI Document Reviewer — S&P Global Automation Hackathon

**Problem:** Large financial documents are hard to navigate. When an analyst needs a specific part of a document, they should be able to **query** it and get **relevant sections** back instead of reading the whole file.

**Solution:** A **RAG (Retrieval Augmented Generation)** pipeline powered by **n8n**: upload a PDF, ask a question, and get an AI-generated answer grounded in the document. The workflow chunks the document, embeds chunks with **Ollama** (e.g. `nomic-embed-text`), stores them in **Chroma**, retrieves relevant chunks for the query, and generates the answer with **Groq**.

---

## Run on Windows

**Prerequisites:** Node.js (LTS), Docker Desktop (for n8n), a [Groq API key](https://console.groq.com) (free), **Chroma** (port 8000), and **Ollama** (port 11434) for embeddings. Use **PowerShell**; run all commands from the **project root** (`document-reviewer-automation`).

| Step | Action |
|------|--------|
| 1 | **Install:** `npm install --prefix ai-doc-backend` then `npm install --prefix frontend` |
| 2 | **Start n8n:** `.\scripts\start-n8n-docker.ps1` (or `docker run -d --name n8n-document-reviewer -p 5678:5678 n8nio/n8n:latest`) |
| 3 | **Start Chroma:** `.\scripts\start-chroma.ps1` then create collection: `python scripts/setup_chroma.py` (see [docs/RAG_SETUP.md](docs/RAG_SETUP.md)) |
| 4 | **Start Ollama** (for embeddings): Install [Ollama](https://ollama.com), run `ollama pull nomic-embed-text` |
| 5 | **Import workflow:** Open http://localhost:5678 → Workflows → Import from File → select `n8n-workflow-document-reviewer.json` → open **Groq Generate** node → set Authorization to `Bearer YOUR_GROQ_API_KEY` → Save → set workflow **Active** (toggle ON) |
| 6 | **Backend env:** Ensure `ai-doc-backend\.env` contains `N8N_WEBHOOK_URL=http://localhost:5678/webhook/document-review` and `PORT=5000` |
| 7 | **Start backend:** `cd ai-doc-backend; npm start` (leave running) |
| 8 | **Start frontend:** In a new terminal: `cd frontend; npm run dev` |
| 9 | **Use app:** Open http://localhost:3000 → upload a PDF (e.g. `test.pdf`) → enter a question → **Analyze** |

**URLs:** n8n http://localhost:5678 · Backend http://localhost:5000 · Frontend http://localhost:3000 · Chroma http://localhost:8000 · Ollama http://localhost:11434  

If the frontend shows "webhook is not registered", turn the workflow **Active** in n8n (top-right toggle). See [NEXT_STEPS.md](NEXT_STEPS.md) for more detail and troubleshooting.

---

## Architecture Overview

```
┌─────────────┐     PDF + query      ┌─────────────┐     { text, query }     ┌──────────────────────────────────────────────────────────┐
│  Frontend   │ ──────────────────► │   Backend   │ ─────────────────────► │  n8n workflow (Document Reviewer with RAG)                │
│  (React)    │                     │  (Express)  │                         │  Webhook → Chunk → Embed (Ollama) → Chroma → Retrieve   │
└─────────────┘                     └─────────────┘                         │  → Build context → Groq LLM → Respond                    │
       │                                    │                                └──────────────────────────────────────────────────────────┘
       │                                    │  pdf-parse                                              │
       │                                    ▼                                                          │
       │                             Extracts text from PDF                                            ▼
       └──────────────────────────── Response: { answer } ◄──────────────────────────────────── Chroma (8000) + Ollama (11434) + Groq
```

- **Frontend:** Upload PDF, enter query, call backend `/analyze`, display the answer.
- **Backend:** Receives PDF + query, extracts text with `pdf-parse`, POSTs `{ text, query }` to the n8n webhook, returns the result to the frontend.
- **n8n workflow:** Receives `{ text, query }`, chunks the text, embeds chunks with Ollama, inserts into Chroma, embeds the query, retrieves top-k chunks from Chroma, builds a context prompt, and calls Groq to generate `{ answer }`. Same webhook contract: input `{ text, query }`, output `{ answer }`.

---

## Repository Structure

| Path | Description |
|------|-------------|
| **`n8n-workflow-document-reviewer.json`** | **Main n8n workflow** — RAG pipeline: Webhook → Extract Body → Chunk Text → Ollama Embed → Chroma Add → Chroma Query → Build Prompt → Groq Generate → Respond to Webhook. |
| **`scripts/`** | Helper scripts: `start-n8n-docker.ps1`, `health-check.ps1`, `test-workflow.ps1`, `setup_chroma.py`, and others. Run from project root (e.g. `.\scripts\start-n8n-docker.ps1`). |
| **`docs/`** | All guides: setup, n8n workflow, Groq, Ollama troubleshooting, Chroma, Vercel. |
| **`ai-doc-backend/`** | Express backend: PDF upload, text extraction, proxy to n8n webhook. |
| **`frontend/`** | React (Vite) UI: file upload, query input, results display. |
| **`n8n/`** | n8n-related assets: `package.json`, Chroma persistence data (when using RAG). |
| **`test.pdf`** | Sample PDF in the repo for testing the app (optional). |

---

## Essential vs extra files

**You only need these to run the final project:**

| What | Where |
|------|--------|
| **The workflow to import** | `n8n-workflow-document-reviewer.json` (root) — this is the correct, final workflow |
| **Backend** | `ai-doc-backend/` |
| **Frontend** | `frontend/` |
| **Backend env** | `ai-doc-backend/.env` (copy from `.env.example`) |
| **Chroma + Ollama (RAG)** | `scripts/start-chroma.ps1`, `scripts/setup_chroma.py`, Ollama with `nomic-embed-text` — required for the RAG workflow. See [docs/RAG_SETUP.md](docs/RAG_SETUP.md). |

**Optional reading:**

- **`docs/OLLAMA_FIX.md`** — Ollama troubleshooting.

The **correct and final** workflow file is **`n8n-workflow-document-reviewer.json`** (webhook path: `document-review`, uses Groq).

---

## Detailed run steps (Windows)

Use **PowerShell** from the project root. Same flow as the table above.

1. **Install dependencies** (once):
   ```powershell
   npm install --prefix ai-doc-backend
   npm install --prefix frontend
   ```

2. **Start n8n**  
   Run `.\scripts\start-n8n-docker.ps1` or `docker run -d --name n8n-document-reviewer -p 5678:5678 n8nio/n8n:latest`. Open http://localhost:5678 (without `-p 5678:5678` the webhook is not reachable).

3. **Import and activate workflow** in n8n:
   - **Workflows** → **Import from File**
   - Select **`n8n-workflow-document-reviewer.json`** from the project root.
   - In the **Groq Generate** node, set **Authorization** to `Bearer YOUR_GROQ_API_KEY` ([docs/GROQ_SETUP.md](docs/GROQ_SETUP.md)).
   - **Save** and **Activate**.
   - Copy the **Production** webhook URL: `http://localhost:5678/webhook/document-review`.

5. **Configure backend** — create `ai-doc-backend/.env`:
   ```env
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/document-review
   PORT=5000
   ```

6. **Start backend** (Terminal 2):
   ```bash
   cd ai-doc-backend && npm start
   ```

7. **Start frontend** (Terminal 3):
   ```bash
   cd frontend && npm run dev
   ```

8. **Use the app**  
   Open **http://localhost:3000** → upload a PDF → enter a question → **Analyze Document**. Results come from the n8n workflow.

**Summary:** The “final project” = **frontend** (port 3000) + **backend** (5000) + **n8n** (5678) with **`n8n-workflow-document-reviewer.json`** imported and active.

---

## n8n Workflow (RAG / Document Reviewer)

The **document reviewer** is implemented as an n8n workflow with a **full RAG pipeline**.

### What the workflow does

1. **Webhook** — Receives `POST` with JSON: `{ "text": "<full document text>", "query": "<user question>" }`.
2. **Extract Body** — Validates and normalizes `text` and `query`; generates a per-request `documentId` for Chroma metadata.
3. **Chunk Text** — Splits the document into chunks (~1000 chars, 200 overlap).
4. **Ollama Embed Chunks** — Embeds each chunk with `nomic-embed-text` (Ollama on port 11434).
5. **Merge Chunk + Embed** — Combines chunk text and embeddings for Chroma.
6. **Build Chroma Add** / **Chroma Add** — Inserts chunk embeddings into Chroma collection `documents` with metadata `documentId`.
7. **Pass Query + DocId** — Forwards `query` and `documentId` for retrieval.
8. **Ollama Embed Query** — Embeds the user query.
9. **Build Chroma Query** / **Chroma Query** — Retrieves top-5 chunks from Chroma filtered by `documentId`.
10. **Build Groq Prompt** — Builds a prompt from retrieved context + query.
11. **Groq Generate** — Calls Groq LLM; **Respond to Webhook** returns `{ "answer": "..." }`.

The frontend and backend contract is unchanged: **input** `{ text, query }`, **output** `{ answer }`. Chroma and Ollama must be running; see [docs/RAG_SETUP.md](docs/RAG_SETUP.md) for setup and troubleshooting.

---

## Services Reference

| Service   | Port  | Purpose |
|----------|-------|--------|
| Frontend | 3000  | React UI |
| Backend  | 5000  | PDF parsing, n8n proxy |
| n8n      | 5678  | Workflow engine, webhook |
| Ollama   | 11434 | Embeddings for RAG (`nomic-embed-text`) |
| Chroma   | 8000  | Vector store for RAG (collection `documents`) |

---

## Documentation

- **[docs/RAG_SETUP.md](docs/RAG_SETUP.md)** — RAG prerequisites: Chroma, Ollama embeddings, chunking, and troubleshooting.
- **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** — Full setup, Chroma, health checks, troubleshooting.
- **[docs/N8N_WORKFLOW_GUIDE.md](docs/N8N_WORKFLOW_GUIDE.md)** — Contract, workflow details, frontend/backend options.
- **[docs/N8N_STEP_BY_STEP_WORKFLOW.md](docs/N8N_STEP_BY_STEP_WORKFLOW.md)** — Building the workflow node-by-node in n8n.
- **[docs/GROQ_SETUP.md](docs/GROQ_SETUP.md)** — Groq API key and model configuration.
- **[scripts/README.md](scripts/README.md)** — List of helper scripts and how to run them.

---

## Testing the webhook

With the workflow **Active**. On Windows (PowerShell) run `.\scripts\test-workflow.ps1` and enter `http://localhost:5678/webhook/document-review` when prompted. Alternatively:

```bash
curl -X POST http://localhost:5678/webhook/document-review \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"The company was founded in 2020. It sells software.\", \"query\": \"When was the company founded?\"}"
```

Expected: JSON with an `answer` field containing the model’s reply.

---

## License & context

Built for the **S&P Global automation hackathon**. The solution uses **n8n** for the document-review RAG workflow (chunk → embed → Chroma → retrieve → Groq), with a **React** frontend and **Express** backend for PDF handling and a clean analyst-facing experience.
