# n8n Workflow — Document Reviewer (RAG)

This folder holds **n8n-related assets** for the S&P Global Document Reviewer hackathon project.

## What’s in this folder

| Item | Description |
|------|-------------|
| **`package.json`** | Optional: run n8n from here with `npx n8n start` (or use the global `n8n` CLI). |
| **`chroma/`** | Persisted ChromaDB data when using the **RAG** pipeline (chunk → embed → Chroma → retrieve). Created when Chroma runs and you upsert document chunks. |
| **`README.md`** | This file. |

## The actual workflow file

The workflow definition is in the **project root**, not in this folder:

- **`../n8n-workflow-document-reviewer.json`** — Import this file in n8n (**Workflows** → **Import from File**).

That workflow implements the **simple** path: Webhook → Extract Body → Groq (or Ollama) → Respond to Webhook. No Chroma in the importable JSON; RAG (Chroma + embeddings) is described in the docs and can be added in n8n using the helper code in the root (`n8n-merge-*.js`, `n8n-chroma-*.js`, etc.).

## Quick start

1. Start n8n (from this folder: `npx n8n start`, or globally: `n8n start`).
2. In n8n: **Import from File** → select **`n8n-workflow-document-reviewer.json`** from the repo root.
3. Set your **Groq API key** in the **Groq Generate** node (see [../docs/GROQ_SETUP.md](../docs/GROQ_SETUP.md)).
4. **Save** and **Activate** the workflow.
5. Use the **Production** webhook URL in the backend: `N8N_WEBHOOK_URL=http://localhost:5678/webhook/document-review`.

Full setup and architecture: see the main [../README.md](../README.md).
