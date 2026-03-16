r"""
Embedded Chroma-compatible API (no Chroma server or Docker).
Uses hnswlib for vector search and local files for persistence; exposes the same
HTTP API that the n8n Document Reviewer workflow expects (default port 8010).

Run: .\scripts\start-chroma-embedded.ps1
Or: cd chroma-embedded && .venv\Scripts\python server.py
Set CHROMA_EMBEDDED_PORT to use a different port (default 8010).
"""
import json
import os
from pathlib import Path

import hnswlib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any

DATA_DIR = Path(__file__).resolve().parent / "chroma_data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
INDEX_PATH = DATA_DIR / "index.bin"
DATA_PATH = DATA_DIR / "data.json"

COLLECTION_NAME = "documents"
# Default embedding dim for Gemini text-embedding-001
DEFAULT_DIM = 768

# In-memory store: index + parallel arrays
_index: Optional[hnswlib.Index] = None
_ids: List[str] = []
_documents: List[str] = []
_metadatas: List[dict] = []
_dim: Optional[int] = None


def _get_index(dim: int) -> hnswlib.Index:
    global _index, _dim
    if _index is None:
        _index = hnswlib.Index(space="cosine", dim=dim)
        _index.init_index(max_elements=100_000, ef_construction=200, M=16)
        _dim = dim
    if dim != _dim:
        raise HTTPException(status_code=400, detail=f"Embedding dimension mismatch: expected {_dim}, got {dim}")
    return _index


def _load_data():
    global _ids, _documents, _metadatas, _index, _dim
    if DATA_PATH.exists():
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            d = json.load(f)
        _ids = d.get("ids", [])
        _documents = d.get("documents", [])
        _metadatas = d.get("metadatas", [])
        _dim = d.get("dim")
    n = len(_ids)
    if n == 0:
        return
    dim = _dim or DEFAULT_DIM
    _dim = dim
    try:
        if INDEX_PATH.exists():
            _index = hnswlib.Index(space="cosine", dim=dim)
            _index.load_index(str(INDEX_PATH), max_elements=max(n + 10000, 100000))
            _index.set_ef(50)
        else:
            vpath = DATA_DIR / "vectors.npy"
            if vpath.exists():
                emb = np.load(vpath, allow_pickle=False)
                if emb.size > 0 and emb.shape[0] == n:
                    dim = int(emb.shape[1])
                    _dim = dim
                    _index = hnswlib.Index(space="cosine", dim=dim)
                    _index.init_index(max_elements=max(n + 10000, 100000), ef_construction=200, M=16)
                    _index.add_items(emb, np.arange(n, dtype=np.int64))
                    _index.set_ef(50)
                    _index.save_index(str(INDEX_PATH))
    except Exception:
        pass


def _save_data():
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump({"ids": _ids, "documents": _documents, "metadatas": _metadatas, "dim": _dim}, f, indent=0)


def _persist_vectors(embeddings: np.ndarray):
    vpath = DATA_DIR / "vectors.npy"
    if vpath.exists():
        existing = np.load(vpath, allow_pickle=False)
        embeddings = np.vstack([existing, embeddings])
    np.save(vpath, embeddings.astype(np.float32), allow_pickle=False)


# Load on startup
_load_data()

app = FastAPI(title="Chroma Embedded (RAG)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# --- Request/response models (Chroma-compatible) ---

class AddRequest(BaseModel):
    ids: List[str]
    embeddings: Optional[List[List[float]]] = None
    metadatas: Optional[List[dict]] = None
    documents: Optional[List[str]] = None


class QueryRequest(BaseModel):
    query_embeddings: List[List[float]]
    n_results: int = 5
    where: Optional[dict] = None
    include: Optional[List[str]] = None


@app.get("/api/v1/heartbeat")
def heartbeat():
    return {"nanosecond heartbeat": 0}


@app.get("/api/v1/collections")
def list_collections():
    return [{"name": COLLECTION_NAME, "id": COLLECTION_NAME}]


@app.post("/api/v1/collections/documents/add")
def add_documents(body: AddRequest):
    global _ids, _documents, _metadatas, _dim
    if not body.ids:
        raise HTTPException(status_code=400, detail="ids required")
    if not body.embeddings and not body.documents:
        raise HTTPException(status_code=400, detail="embeddings or documents required")
    n = len(body.ids)
    embeddings = body.embeddings or []
    metadatas = (body.metadatas or [{}])[:n]
    documents = (body.documents or [""])[:n]
    while len(metadatas) < n:
        metadatas.append({})
    while len(documents) < n:
        documents.append("")
    if embeddings:
        dim = len(embeddings[0])
        if _dim is None:
            _dim = dim
        arr = np.array(embeddings, dtype=np.float32)
        index = _get_index(dim)
        start = len(_ids)
        labels = np.arange(start, start + n, dtype=np.int64)
        index.add_items(arr, labels)
        _persist_vectors(arr)
    for i in range(n):
        _ids.append(body.ids[i])
        _documents.append(documents[i])
        _metadatas.append(metadatas[i])
    _save_data()
    if _index is not None:
        _index.save_index(str(INDEX_PATH))
    return {"status": "ok"}


@app.post("/api/v1/collections/documents/query")
def query_documents(body: QueryRequest):
    if not body.query_embeddings:
        raise HTTPException(status_code=400, detail="query_embeddings required")
    include = body.include or ["documents", "metadatas", "distances"]
    if _index is None or len(_ids) == 0:
        return {
            "ids": [[]],
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]],
        }
    dim = len(body.query_embeddings[0])
    index = _get_index(dim)
    q = np.array(body.query_embeddings, dtype=np.float32)
    k = min(body.n_results, len(_ids))
    labels, distances = index.knn_query(q, k=k)
    # labels are 0-based indices into _ids, _documents, _metadatas
    out_ids = []
    out_docs = []
    out_meta = []
    out_dist = []
    for i in range(q.shape[0]):
        row_labels = labels[i].tolist()
        out_ids.append([_ids[j] for j in row_labels])
        if "documents" in include:
            out_docs.append([_documents[j] for j in row_labels])
        if "metadatas" in include:
            out_meta.append([_metadatas[j] for j in row_labels])
        if "distances" in include:
            out_dist.append(distances[i].tolist())
    result = {"ids": out_ids}
    if "documents" in include:
        result["documents"] = out_docs
    if "metadatas" in include:
        result["metadatas"] = out_meta
    if "distances" in include:
        result["distances"] = out_dist
    return result


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("CHROMA_EMBEDDED_PORT", "8010"))
    uvicorn.run(app, host="0.0.0.0", port=port)
