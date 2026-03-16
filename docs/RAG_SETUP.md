# RAG Setup — Document Reviewer

This guide covers the **Retrieval-Augmented Generation (RAG)** pipeline used by the n8n Document Reviewer workflow: chunking, embeddings (Google Gemini), Chroma vector store, and troubleshooting.

---

## Overview

The workflow:

1. **Chunks** the document text (~1000 characters, 200 overlap).
2. **Embeds** each chunk with Google Gemini (`gemini-embedding-001` via Gemini API / Google AI Studio free tier).
3. **Stores** embeddings in Chroma (collection `documents`) with metadata `documentId` per request.
4. **Embeds** the user query and **retrieves** top-5 chunks from Chroma filtered by `documentId`.
5. **Builds** a prompt from retrieved context and sends it to **Groq** for the final answer.

Same webhook contract: **input** `{ text, query }`, **output** `{ answer }`.

---

## Prerequisites

| Service        | Port / API | Purpose |
|----------------|------------|--------|
| **Chroma**     | 8010 (embedded) or 8000 (Docker) | Vector store; collection name `documents`. |
| **Google Gemini** | API key | Embeddings model `gemini-embedding-001` (free tier at [Google AI Studio](https://aistudio.google.com/apikey)). |
| **Groq**       | API key    | LLM for generation (in n8n). |

---

## Chroma (vector store)

### Option A: Embedded Chroma (recommended — no Docker)

Uses Chroma as a library with `PersistentClient`; a small Python server exposes the same HTTP API on port **8010** (to avoid conflict with official Chroma on 8000). No separate Chroma server or Docker required.

1. **Install and start** (from project root):
   ```powershell
   pip install -r chroma-embedded/requirements.txt
   python chroma-embedded/server.py
   ```
   Or run `.\scripts\start-chroma-embedded.ps1`.

2. The **documents** collection is created automatically on first use. Data is stored in `chroma-embedded/chroma_data/`.

3. **Verify:** `GET http://localhost:8010/api/v1/heartbeat` should return 200.

See [chroma-embedded/README.md](../chroma-embedded/README.md) for details.

### Option B: Chroma server (Docker)

If you prefer the official Chroma server:

1. Run `.\scripts\start-chroma.ps1` (requires Docker).
2. Create the collection once: `python scripts/setup_chroma.py`.
3. The n8n workflow uses the embedded Chroma URLs (`http://localhost:8010/api/v1/collections/documents/...`). If you use Docker Chroma on 8000, change those URLs in the workflow to port 8000.

---

## Google Gemini (embeddings)

1. **Get an API key:** Go to [Google AI Studio](https://aistudio.google.com/apikey) and create an API key. The free tier supports the `gemini-embedding-001` embedding model.

2. **Configure the workflow:** In n8n, open the **Google Embed Chunks** and **Google Embed Query** nodes. Set the `x-goog-api-key` header to your Gemini API key (replace `YOUR_GEMINI_API_KEY`).

3. **API details:**
   - **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`
   - **Header:** `x-goog-api-key: <your-api-key>`
   - **Request body:** `{ "model": "models/gemini-embedding-001", "content": { "parts": [{ "text": "<text to embed>" }] } }`
   - **Response:** `{ "embedding": { "values": [ ... array of 3072 floats ... ] } }`

The workflow reads `embedding.values` from the response and uses it for Chroma add/query. No local server is required; everything runs over HTTPS.

---

## Chunking

- **Chunk size:** 1000 characters (configurable in the **Chunk Text** Code node).
- **Overlap:** 200 characters to keep context across boundaries.
- **Model limit:** `gemini-embedding-001` supports long inputs (e.g. up to 2,048 tokens per request); 1000 chars per chunk is safe. If you see errors, reduce chunk size (e.g. 500).

---

## Embedding options (alternatives)

- **Google Gemini (default):** Free tier via Google AI Studio; model `gemini-embedding-001` (3,072 dimensions).
- **Ollama:** For fully local embeddings, replace the Google HTTP nodes with Ollama (`http://localhost:11434/api/embeddings`, model `nomic-embed-text`) and adjust the Build Chroma Add / Build Chroma Query code to use `embedding` (array) instead of `embedding.values`.
- **OpenAI:** Replace with OpenAI embeddings API and use the same Chroma add/query payloads (add API key and node configuration).

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| **"Workflow returned no data"** | Backend must call the **production** webhook: `N8N_WEBHOOK_URL=http://localhost:5678/webhook/document-review` in `ai-doc-backend/.env` (use `/webhook/`, not `/webhook-test/`). Workflow must be **Active**. In n8n, open **Executions** and check the latest run for a failed node (e.g. Gemini, Chroma, Groq). |
| "No embeddings received from Gemini" | Valid Gemini API key in **Google Embed Chunks** / **Google Embed Query** (`x-goog-api-key` header); key has access to Embedding API; request body uses `content.parts[].text`. |
| Chroma add/query fails | Embedded: Chroma running on 8010 (`.\scripts\start-chroma-embedded.ps1`). Docker: port 8000; run `python scripts/setup_chroma.py` to create collection `documents`. Ensure workflow node URLs use the correct port. |
| "Query embedding missing" | Merge node **Merge Query + Embed** must receive both Pass Query + DocId output (query, documentId) and Google Embed Query output (embedding with `values`). Check connections. |
| Empty or poor answers | Increase **n_results** in **Build Chroma Query** (e.g. 8); or check that chunks and query are embedded with the same model. |

---

## Multiple questions on the same document (future)

To support "upload once, ask many" without re-ingesting:

- Backend could send a stable `documentId` (e.g. hash of the file) and, for follow-up questions, send only `{ query, documentId }` (no `text`).
- The workflow would need a branch: when `text` is missing, skip Chunk → Embed → Chroma Add and only run Embed Query → Chroma Query → Groq. This would require a second webhook or conditional logic in the same workflow.
