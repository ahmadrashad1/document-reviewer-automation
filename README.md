# AI Document Reviewer — S&P Global Automation Hackathon

**Problem:** Large financial documents are hard to navigate. When an analyst needs a specific part of a document, they should be able to **query** it and get **relevant sections** back instead of reading the whole file.

**Solution:** A **RAG (Retrieval Augmented Generation)** pipeline powered by **n8n**: upload a PDF, ask a question, and get an AI-generated answer grounded in the document. The system can run in a **simple mode** (full document + LLM) or be extended with **RAG** (chunk → embed → Chroma → retrieve → LLM) for better scalability on very long documents.

---

## Architecture Overview

```
┌─────────────┐     PDF + query      ┌─────────────┐     { text, query }     ┌─────────────────────────────────────┐
│  Frontend   │ ──────────────────► │   Backend   │ ─────────────────────► │  n8n workflow (Document Reviewer)   │
│  (React)    │                     │  (Express)  │                         │  Webhook → Extract → LLM → Respond  │
└─────────────┘                     └─────────────┘                         └─────────────────────────────────────┘
       │                                    │                                              │
       │                                    │  pdf-parse                                   │  Optional: Chroma + embeddings
       │                                    ▼                                              │  for RAG (chunk → embed → query)
       │                             Extracts text from PDF                                ▼
       └──────────────────────────── Response: { answer } ◄──────────────────────────── Groq / Ollama
```

- **Frontend:** Upload PDF, enter query, call backend `/analyze`, display the answer.
- **Backend:** Receives PDF + query, extracts text with `pdf-parse`, POSTs `{ text, query }` to the n8n webhook, returns the result to the frontend.
- **n8n workflow:** Receives `{ text, query }`, (optionally runs RAG with Chroma), calls an LLM (Groq or Ollama), returns `{ answer }`.

---

## Repository Structure

| Path | Description |
|------|-------------|
| **`n8n-workflow-document-reviewer.json`** | **Main n8n workflow** — import this into n8n. Webhook → Extract Body → Groq Generate → Respond to Webhook. |
| **`n8n/`** | n8n-related assets: `package.json` (for running n8n), Chroma persistence data (when using RAG). |
| **`ai-doc-backend/`** | Express backend: PDF upload, text extraction, proxy to n8n webhook. |
| **`frontend/`** | React (Vite) UI: file upload, query input, results display. |
| **`docs/`** | Guides: n8n workflow, step-by-step build, Groq setup, HTTP/raw body fixes. |
| **`setup_chroma.py`** | One-time script to create the Chroma `documents` collection (for RAG). |
| **`n8n-*.js`**, **`n8n-*.md`** | Helper code and debug notes for RAG (chunking, merge, Chroma format). |

---

## n8n Workflow (RAG / Document Reviewer)

The **document reviewer** is implemented as an n8n workflow.

### What the workflow does

1. **Webhook** — Receives `POST` with JSON: `{ "text": "<full document text>", "query": "<user question>" }`.
2. **Extract Body** — Validates and normalizes `text` and `query`; builds the request body for the LLM (Groq or Ollama).
3. **LLM (Groq Generate)** — Sends the document + question to the LLM; returns the model’s answer.
4. **Respond to Webhook** — Returns `{ "answer": "<LLM response>" }` to the client.

The frontend and backend expect this contract: **input** `{ text, query }`, **output** `{ answer }` (or a string). The backend sends `text` (extracted from the PDF) and `query`; the frontend displays `answer`.

### Optional: full RAG (Chroma + chunks)

For very long documents, the docs describe an extended pipeline:

1. Chunk the document (e.g. by paragraph or ~500–1000 chars).
2. Embed chunks (e.g. Ollama embeddings or Groq/OpenAI-style API).
3. Upsert into **Chroma** (collection `documents`).
4. Embed the user query, query Chroma for top-k chunks.
5. Merge retrieved chunks into a context string.
6. Call the LLM with context + query.
7. Respond with `{ answer }`.

The files `n8n-merge-*.js`, `n8n-chroma-*.js`, and the `n8n-*-fix.md` / `n8n-*-solution.md` docs in the repo are references for building or debugging that RAG chain in n8n. The **importable workflow** (`n8n-workflow-document-reviewer.json`) is the **simple** path (no Chroma); you can extend it using the RAG steps in the guides.

---

## Quick Start

### Prerequisites

- **Node.js** (for backend and frontend)
- **n8n** (local or Docker)
- **LLM:** Groq (recommended, no local GPU) or Ollama (local)

### 1. Clone and install

```bash
cd document-reviewer-automation
npm install --prefix ai-doc-backend
npm install --prefix frontend
```

### 2. Start n8n

```bash
n8n start
# Or with Docker: see docker-compose.yml
```

Open n8n at **http://localhost:5678**.

### 3. Import the workflow

1. In n8n: **Workflows** → **Import from File** (or **Add workflow** → **Import**).
2. Choose **`n8n-workflow-document-reviewer.json`** from the project root.
3. **Groq:** In the **Groq Generate** node, set the **Authorization** header to `Bearer YOUR_GROQ_API_KEY` (see [docs/GROQ_SETUP.md](docs/GROQ_SETUP.md)).
4. **Ollama:** Replace the Groq node with an Ollama/HTTP Request node to `http://localhost:11434/api/generate` (or `http://host.docker.internal:11434` if n8n runs in Docker).
5. **Save** and **Activate** the workflow.
6. Copy the **Production** webhook URL (e.g. `http://localhost:5678/webhook/document-review`).

### 4. Configure backend

Create `ai-doc-backend/.env` (see `ai-doc-backend/.env.example`):

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/document-review
PORT=5000
```

### 5. Start backend and frontend

```bash
# Terminal 1 – backend
cd ai-doc-backend && npm start

# Terminal 2 – frontend
cd frontend && npm run dev
```

- Frontend: **http://localhost:3000**
- Upload a PDF, enter a question, click **Analyze Document**. The backend will extract text, call the n8n webhook, and show the `answer` in the UI.

### Optional: Chroma (for RAG)

If you add the RAG pipeline in n8n:

1. Install and start Chroma (e.g. `pip install chromadb` then `chroma run --host localhost --port 8000` from the `n8n` folder or a venv).
2. Create the collection: `python setup_chroma.py` (with Chroma running).
3. Build the chunk → embed → Chroma → query → LLM flow in n8n using the steps in **docs/N8N_WORKFLOW_GUIDE.md** (Section 4) and the helper code in the `n8n-*.js` / `n8n-*.md` files.

---

## Services Reference

| Service   | Port  | Purpose |
|----------|-------|--------|
| Frontend | 3000  | React UI |
| Backend  | 5000  | PDF parsing, n8n proxy |
| n8n      | 5678  | Workflow engine, webhook |
| Ollama   | 11434 | Local LLM (optional) |
| Chroma   | 8000  | Vector store for RAG (optional) |

---

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** — Full setup, Chroma, health checks, troubleshooting.
- **[docs/N8N_WORKFLOW_GUIDE.md](docs/N8N_WORKFLOW_GUIDE.md)** — Contract, simple workflow, optional RAG, frontend/backend options.
- **[docs/N8N_STEP_BY_STEP_WORKFLOW.md](docs/N8N_STEP_BY_STEP_WORKFLOW.md)** — Building the workflow node-by-node in n8n.
- **[docs/GROQ_SETUP.md](docs/GROQ_SETUP.md)** — Groq API key and model configuration.

---

## Testing the webhook directly

With the workflow **Active**:

```bash
curl -X POST http://localhost:5678/webhook/document-review \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"The company was founded in 2020. It sells software.\", \"query\": \"When was the company founded?\"}"
```

Expected: JSON with an `answer` field containing the model’s reply.

---

## License & context

Built for the **S&P Global automation hackathon**. The solution uses **n8n** for the document-review and optional RAG workflow, with a **React** frontend and **Express** backend for PDF handling and a clean analyst-facing experience.
