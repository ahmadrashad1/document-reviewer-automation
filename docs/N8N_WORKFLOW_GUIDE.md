# Document Reviewer – n8n Workflow Guide

This guide explains **whether you need the backend**, then gives a **node-by-node** workflow that matches your frontend.

---

## 1. Do We Need the Backend?

### Current flow
- **Frontend** sends: `FormData` with `document` (PDF file) + `query` (string).
- **Backend** receives the file, extracts text with `pdf-parse`, then POSTs to n8n: `{ text, query }`.
- **n8n** returns the answer; backend wraps it as `{ success: true, data: <your result> }`; frontend shows `data`.

### Option A: Keep the backend (recommended if you want no frontend changes)
- **Pros:** No frontend changes. PDF parsing stays on the server (no big JS libs in the browser). Same API as now.
- **Cons:** One extra service to run.
- **n8n input:** JSON body with `text` (extracted PDF text) and `query` (user question). Your workflow only needs to handle JSON.

### Option B: Frontend → n8n directly (no backend)
- **Pros:** One less service. Frontend talks only to n8n.
- **Cons:** Frontend must parse PDF in the browser (e.g. with `pdfjs-dist`) and send JSON `{ text, query }` to the n8n webhook. You’ll need small frontend changes (see below).
- **n8n input:** Same: JSON with `text` and `query`. No file upload in n8n; the “document” is the extracted `text` string.

**Summary:**  
- If you **keep the backend**, it keeps doing PDF → text and POSTing `{ text, query }` to n8n; you only build the n8n workflow.  
- If you **drop the backend**, the frontend must send that same JSON to n8n (after parsing the PDF in the browser). The workflow is the same in both cases.

---

## 2. Contract Your Workflow Must Honor

So the workflow works with both Option A and B:

| Source        | Input to n8n              | Output n8n should return                    |
|---------------|---------------------------|--------------------------------------------|
| Backend (A)   | POST JSON: `{ text, query }` | Any of: string, or `{ answer }`, `{ response }`, `{ result }`, `{ text }` |
| Frontend (B)  | Same JSON                 | Same                                       |

The frontend’s `ResultsDisplay` already handles:
- Plain **string**
- Object with **`answer`**, **`response`**, **`result`**, or **`text`**

So your **Respond to Webhook** node should return either:
- A string (the answer), or  
- An object, e.g. `{ "answer": "…" }`.

---

## 3. Node-by-Node Workflow (Simple: No RAG)

This version uses the **full document text** + **query** and asks the LLM once. No Chroma/embeddings.

### Node 1: Webhook (trigger)
- **Node:** **Webhook**
- **HTTP Method:** `POST`
- **Path:** e.g. `document-review` (your URL will be `https://your-n8n/webhook/document-review` or `http://localhost:5678/webhook/document-review`)
- **Response Mode:** `When Last Node Finishes` (so the “Respond to Webhook” node can send the reply)
- **Options:** Leave defaults.

**Incoming body (from backend or frontend):**
```json
{
  "text": "Full extracted PDF text…",
  "query": "What is the main topic?"
}
```

---

### Node 2: Extract body (Code or “Set”)
- **Node:** **Code** (or **Set** if you prefer)
- **Purpose:** Normalize so the next nodes always see `text` and `query` from the request body.

**Code node (JavaScript):**
```javascript
const body = $input.first().json.body ?? $input.first().json;
const text = body.text ?? body.documentText ?? '';
const query = body.query ?? '';

if (!text || !query) {
  throw new Error('Missing text or query in request body');
}

return [{ json: { text, query } }];
```

- **If your webhook puts the payload in `body`:** use `body` as above.  
- **If the webhook puts it in the root:** `$input.first().json` already has `text` and `query`, so you can just pass them through.

---

### Node 3: LLM (e.g. Ollama)
- **Node:** **Ollama** (or **OpenAI** / **HTTP Request** to your LLM API)
- **Model:** e.g. `llama3.1` or whatever you use
- **Prompt:** Use the `text` and `query` from the previous node.

**Prompt (example):**
```
You are a document analyst. Use only the following document text to answer the question. If the answer is not in the text, say so.

Document text:
{{ $json.text }}

Question: {{ $json.query }}

Answer (concise, in plain text):
```

- **Connect:** Input from Node 2 (one item with `text` and `query`).  
- **Output:** One item with the model’s reply (e.g. in `$json.response` or `$json.message`, depending on the node).

---

### Node 4: Respond to Webhook
- **Node:** **Respond to Webhook**
- **Respond With:** `JSON`
- **Response Body:** Shape the payload so the frontend gets either a string or an object with `answer`.

**Option 1 – object (recommended):**
- **Response Body:**  
  `{{ { "answer": $json.response } }}`  
  (adjust `$json.response` to the field name your Ollama node actually returns, e.g. `$json.message` or `$json.text`)

**Option 2 – plain string:**  
- **Response Body:**  
  `{{ $json.response }}`  
  (again, use the real response field from your LLM node)

- **Connect:** From the Ollama (or LLM) node.  
- **Important:** This node must be connected to the **same Webhook** (same execution). In the Webhook node settings, “Response Mode” = “When Last Node Finishes” and “Respond With” should point to this node (or the branch that ends here).

After you save and activate the workflow, use the **Production** webhook URL in:
- **Backend:** `N8N_WEBHOOK_URL=http://n8n:5678/webhook/document-review` (or with your path)
- **Frontend (Option B):** same URL when calling n8n directly.

---

## 4. Optional: RAG (Chroma + chunks)

If you want retrieval (chunk document → embed → store → retrieve → then LLM):

1. **Webhook** (same as above).
2. **Extract body** (same as above) → `text`, `query`.
3. **Chunk text** (Code node): split `text` into chunks (e.g. by paragraphs or ~500–1000 chars), output one item per chunk, each with `chunk`, `query`.
4. **Embed chunks** (e.g. Ollama embeddings or HTTP to `/api/embeddings`) → add `embedding` to each item.
5. **Upsert to Chroma** (HTTP Request to your Chroma API) with chunk text and embedding.
6. **Embed query** (same embedding model) for `query`.
7. **Query Chroma** (HTTP Request) with query embedding → get top-k chunks.
8. **Merge chunks** (Code node): combine chunk texts into one “context” string.
9. **LLM** (Ollama): prompt with “Context: …” + “Question: {{ $json.query }}”.
10. **Respond to Webhook**: return `{ "answer": "<LLM output>" }`.

You can add this RAG chain later; the simple flow (Section 3) is enough to match the frontend and backend.

---

## 5. If You Remove the Backend (Frontend → n8n Only)

1. **Frontend:** Parse the PDF in the browser (e.g. with `pdfjs-dist`), get `documentText`.
2. **Frontend:** POST JSON to the n8n webhook:
   ```js
   await axios.post(N8N_WEBHOOK_URL, { text: documentText, query }, { headers: { 'Content-Type': 'application/json' } });
   ```
3. **Frontend:** Read the response:  
   - If n8n returns `{ answer: "…" }`, use `response.data.answer` (or `response.data` if it’s a string) and pass that to `setResults(...)` so `ResultsDisplay` can show it.  
   - You can keep using `setResults(response.data)` if n8n returns `{ answer: "…" }`; `formatResults` in `ResultsDisplay` will use `data.answer`.

So: **no backend is required** if the frontend does PDF parsing and sends `{ text, query }` and you implement the workflow above. The “endpoints” are just the one n8n webhook URL; the frontend calls it and displays the JSON (or string) it gets back.

---

## 6. Quick Checklist

- [ ] Webhook: POST, path set, response mode “When Last Node Finishes”.
- [ ] Body extraction: `text` and `query` from body/root.
- [ ] LLM: prompt uses `{{ $json.text }}` and `{{ $json.query }}`.
- [ ] Respond to Webhook: body is `{ "answer": "…" }` (or string) and connected to the same webhook execution.
- [ ] Backend (if used): `N8N_WEBHOOK_URL` points to this workflow’s Production URL.
- [ ] Frontend: either still calls backend `/analyze`, or (Option B) parses PDF and POSTs `{ text, query }` to n8n and uses `response.data` / `response.data.answer` for `results`.

Once this is in place, your document reviewer workflow will match the frontend (and optional backend) and you can extend it later with RAG if you want.

---

## 7. Import the Ready-Made Workflow

In the project root there is **`n8n-workflow-document-reviewer.json`**. To use it:

1. Open n8n (e.g. http://localhost:5678).
2. **Workflows** → **Import from File** (or **Add workflow** → **Import**).
3. Select `n8n-workflow-document-reviewer.json`.
4. **Ollama URL:** The workflow calls `http://host.docker.internal:11434` so that when n8n runs in Docker it can reach Ollama on your host. If you run n8n **locally** (not in Docker), change the **Ollama Generate** node URL to `http://localhost:11434/api/generate`.
5. **Model:** In the same node, set `model` to the model you use (e.g. `llama3.1`).
6. **Save** and **Activate** the workflow.
7. Copy the **Production** webhook URL (e.g. `http://localhost:5678/webhook/document-review`).  
   - With backend: set `N8N_WEBHOOK_URL` to this URL (and ensure the backend sends `{ text, query }`).  
   - Frontend-only: have the frontend POST `{ text, query }` to this URL and use the returned `answer` in the UI.
