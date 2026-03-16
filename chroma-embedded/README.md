# Chroma Embedded (no Docker, no separate Chroma server)

This folder runs Chroma as a **library** using `PersistentClient`: vectors are stored on disk in `chroma_data/`. A small FastAPI server exposes the same HTTP API the n8n workflow expects, so you don't need to run the official Chroma server or Docker.

## Quick start

From the **project root**:

```powershell
# One-time: install dependencies
pip install -r chroma-embedded/requirements.txt

# Start the embedded Chroma API (port 8010)
python chroma-embedded/server.py
```

Or from this folder:

```powershell
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8010
```

Then run your n8n workflow and backend as usual. The **documents** collection is created automatically on first add.

## Endpoints (Chroma-compatible)

- `GET /api/v1/heartbeat` — health check
- `POST /api/v1/collections/documents/add` — add vectors (ids, embeddings, metadatas, documents)
- `POST /api/v1/collections/documents/query` — query by embedding (query_embeddings, n_results, where)

Data is stored in `chroma-embedded/chroma_data/` (created automatically).
