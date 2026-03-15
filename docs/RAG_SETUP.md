# RAG Setup — Document Reviewer

This guide covers the **Retrieval-Augmented Generation (RAG)** pipeline used by the n8n Document Reviewer workflow: chunking, embeddings (Ollama), Chroma vector store, and troubleshooting.

---

## Overview

The workflow:

1. **Chunks** the document text (~1000 characters, 200 overlap).
2. **Embeds** each chunk with Ollama (`nomic-embed-text`).
3. **Stores** embeddings in Chroma (collection `documents`) with metadata `documentId` per request.
4. **Embeds** the user query and **retrieves** top-5 chunks from Chroma filtered by `documentId`.
5. **Builds** a prompt from retrieved context and sends it to **Groq** for the final answer.

Same webhook contract: **input** `{ text, query }`, **output** `{ answer }`.

---

## Prerequisites

| Service   | Port  | Purpose |
|----------|-------|--------|
| **Chroma** | 8000  | Vector store; collection name `documents`. |
| **Ollama** | 11434 | Embeddings model `nomic-embed-text`. |
| **Groq**  | API   | LLM for generation (API key in n8n). |

---

## Chroma

1. **Start Chroma** (from project root):
   ```powershell
   .\scripts\start-chroma.ps1
   ```
   Or run Chroma manually (e.g. `chroma run --path ./n8n/chroma --port 8000`).

2. **Create the collection** (one-time):
   ```powershell
   python scripts/setup_chroma.py
   ```
   Or use `.\scripts\setup-chroma-collection.ps1` if you prefer PowerShell.

3. **Verify:** Open http://localhost:8000 (if Chroma exposes a simple UI) or rely on the workflow; failed Chroma calls will show in n8n execution.

If your Chroma API uses a **collection ID** (UUID) instead of the name `documents`, update the **Chroma Add** and **Chroma Query** nodes in the workflow: replace `documents` in the URL path with your collection id (e.g. `http://localhost:8000/api/v1/collections/<collection-id>/add`).

---

## Ollama (embeddings)

1. **Install Ollama:** https://ollama.com

2. **Pull the embedding model:**
   ```bash
   ollama pull nomic-embed-text
   ```

3. **Ensure Ollama is running** (default: http://localhost:11434).

The workflow uses **POST** to `http://localhost:11434/api/embeddings` with body:
- `model`: `nomic-embed-text`
- `prompt`: chunk text or query text

If your Ollama version uses the newer **embed** API (`/api/embed` with `input` instead of `prompt`), update the **Ollama Embed Chunks** and **Ollama Embed Query** nodes: set URL to `http://localhost:11434/api/embed` and send `{ "model": "nomic-embed-text", "input": "..." }`. The **Build Chroma Add** and **Build Chroma Query** nodes accept both `embedding` and `embeddings[0]` from the response.

---

## Chunking

- **Chunk size:** 1000 characters (configurable in the **Chunk Text** Code node).
- **Overlap:** 200 characters to keep context across boundaries.
- **Model limit:** `nomic-embed-text` has a 2k token limit; 1000 chars is safe. If you see embedding errors, reduce chunk size (e.g. 500).

---

## Embedding options (alternatives)

- **Ollama (default):** Local, free; use `nomic-embed-text` or `all-minilm`.
- **OpenAI:** Replace the Ollama HTTP nodes with requests to OpenAI embeddings and use the same Chroma add/query payloads. You would need to add an OpenAI API key and adjust the workflow nodes accordingly.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| "No embeddings received from Ollama" | Ollama running on 11434; `ollama pull nomic-embed-text`; correct URL in **Ollama Embed Chunks** / **Ollama Embed Query**. |
| Chroma add/query fails | Chroma running on 8000; collection `documents` exists (`python scripts/setup_chroma.py`); correct collection name or id in node URLs. |
| "Query embedding missing" | Merge node **Merge Query + Embed** must receive both Pass Query + DocId output (query, documentId) and Ollama Embed Query output (embedding). Check connections. |
| Empty or poor answers | Increase **n_results** in **Build Chroma Query** (e.g. 8); or check that chunks and query are embedded with the same model. |

---

## Multiple questions on the same document (future)

To support "upload once, ask many" without re-ingesting:

- Backend could send a stable `documentId` (e.g. hash of the file) and, for follow-up questions, send only `{ query, documentId }` (no `text`).
- The workflow would need a branch: when `text` is missing, skip Chunk → Embed → Chroma Add and only run Embed Query → Chroma Query → Groq. This would require a second webhook or conditional logic in the same workflow.
