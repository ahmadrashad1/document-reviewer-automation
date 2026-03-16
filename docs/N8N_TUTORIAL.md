# Learn n8n by Building This Project

This guide teaches you **n8n** (a workflow automation tool) by walking through how the **Document Reviewer (RAG)** workflow in this project was built. You’ll see how nodes, data, and connections work in a real pipeline.

---

## What is n8n?

**n8n** (pronounced “n-eight-n”) is an open-source **workflow automation** platform. You build **workflows** by connecting **nodes** that:

- Receive data (e.g. webhooks, schedules)
- Process it (Code, HTTP requests, AI, databases)
- Send it onward (APIs, webhooks, files)

Think of it as “if this, then that” (like Zapier/Make) but with more control: you can write JavaScript in **Code** nodes and call any HTTP API with **HTTP Request** nodes.

**Key ideas:**

| Concept | Meaning in n8n |
|--------|-----------------|
| **Workflow** | A graph of nodes and connections. One JSON file = one workflow. |
| **Node** | One step (e.g. Webhook, Code, HTTP Request, Merge). |
| **Item** | One “row” of data. Each node receives **items** and can output **items**. |
| **Connection** | An arrow from one node to another. Data flows along connections. |
| **Execution** | One run of the workflow. Triggered by the trigger node (here: Webhook). |

---

## How This Project Uses n8n

The app (frontend + backend) sends **PDF text + a question** to an n8n **webhook**. The workflow:

1. Receives the request (Webhook)
2. Normalizes the body (Code: Extract Body)
3. Splits the text into chunks (Code: Chunk Text)
4. Embeds each chunk with Google Gemini (HTTP Request)
5. Merges chunks with their embeddings (Merge)
6. Sends embeddings to Chroma (HTTP Request: Chroma Add)
7. Prepares the user query (Code: Pass Query + DocId)
8. Embeds the query (HTTP Request: Google Embed Query)
9. Merges query + embedding (Merge)
10. Queries Chroma for similar chunks (HTTP Request: Chroma Query)
11. Builds a prompt from those chunks (Code: Build Groq Prompt)
12. Calls Groq for an answer (HTTP Request: Groq Generate)
13. Sends the answer back to the client (Respond to Webhook)

So: **one HTTP request in → one HTTP response out**, with many steps in between. Learning how those steps are built in n8n is what this tutorial is about.

---

## Core Concepts, One by One

### 1. Trigger: the Webhook node

**What it does:** Listens for HTTP POSTs at a URL like `https://your-n8n/webhook/document-review`. When the backend POSTs `{ text, query }`, the workflow starts.

**What you learn:**

- **Trigger nodes** start a workflow. No trigger = workflow doesn’t run by itself.
- **Webhook** = “when someone sends an HTTP request here, run this workflow.”
- **Response mode:** We use “Respond to Webhook” (a later node sends the HTTP response). The Webhook node is configured with `responseMode: "responseNode"` so n8n waits until **Respond to Webhook** runs before replying to the client.

**In the workflow:** The Webhook’s output is **one item** whose `json` is the request body (or similar). The next node (Extract Body) reads that.

---

### 2. Shaping data: the Code node

**What it does:** Runs JavaScript. You read input items, transform them, and return new items.

**What you learn:**

- **Input:** `$input` = all items coming into this node. `$input.first()` = first item, `$input.all()` = array of all items.
- **Item shape:** Each item has at least `json` (and optionally `binary`). You usually read/write `item.json`.
- **Return:** You **return an array of items**. Each item is like `{ json: { ... } }`. One item out = next node runs once with that item; many items out = next node runs once per item (or processes the batch, depending on the node).

**Example from this project — Extract Body:**

```javascript
const raw = $input.first().json;
const body = raw.body ?? raw;
const text = (body.text ?? body.documentText ?? '').trim();
const query = (body.query ?? '').trim();
// ...
return [{ json: { text, query, documentId } }];
```

- Reads the first (and only) incoming item’s `json`.
- Normalizes `text` and `query` and creates a `documentId`.
- Returns **one item** with `{ text, query, documentId }`. So the next node gets one item.

**Example — Chunk Text:**

- Input: one item with `text`, `documentId`.
- Output: **many items** (one per chunk), e.g. `return chunks.map((c, i) => ({ json: { ...c, chunkIndex: i } }));`
- So the next node (and the one that merges later) receives **multiple items**.

**Referencing another node:** You can read data from **any node in the same workflow** by name:

```javascript
const extractBody = $('Extract Body').first().json;
```

So later nodes (e.g. Build Chroma Add, Pass Query + DocId) use `$('Extract Body')` to get the original `documentId` and `query` without passing them through every node.

---

### 3. Calling APIs: the HTTP Request node

**What it does:** Sends an HTTP request (GET, POST, etc.) to a URL. Request body and headers can be fixed or use **expressions** (values from the current item or other nodes).

**What you learn:**

- **One input item → one request** (when you have multiple items, n8n usually runs the node once per item).
- **Expressions:** In any field you can use `={{ ... }}`. Inside that you can use `$json` (current item’s `json`), `$('Node Name').first().json`, etc.

**Example — Google Embed Chunks:**

- **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`
- **Body:** `={{ JSON.stringify({ model: 'models/gemini-embedding-001', content: { parts: [{ text: $json.pageContent }] } }) }}`
- So for **each** chunk item, n8n sends one request with that chunk’s `pageContent`. The node runs once per item from “Chunk Text”; the response (embedding) becomes the output item (often one item per request).

**Example — Chroma Add:**

- **URL:** Points to our Chroma server (e.g. `http://host.docker.internal:8010/.../add`).
- **Body:** `={{ JSON.stringify({ ids: $json.ids, embeddings: $json.embeddings, ... }) }}`
- Here the **previous** node (Build Chroma Add) outputs **one** item containing `ids`, `embeddings`, `metadatas`, `documents`. So we send one POST with the full batch.

**Takeaway:** HTTP Request turns “item data” into “API call” and “API response” into “output items.” The shape of the input items (one vs many) and how you build the body in expressions determines how many requests run.

---

### 4. Merging two branches: the Merge node

**What it does:** Has **two inputs**. It combines items from Input 1 and Input 2 in a defined way.

**What you learn:**

- **Two branches:** One part of the workflow can do A, another part B; Merge brings A and B together.
- **Merge by position:** We use “Merge by Position”: first item from Input 1 with first item from Input 2, second with second, etc. So we get (chunk_1, embedding_1), (chunk_2, embedding_2), …
- **Why we need it:** “Chunk Text” outputs many chunk items. “Google Embed Chunks” runs once per chunk and outputs one item per chunk (each with that chunk’s embedding). We need to **pair** chunk 1 with embedding 1, chunk 2 with embedding 2. Merge does that.

**In this project:**

- **Merge Chunk + Embed:** Input 1 = Chunk Text (many items), Input 2 = Google Embed Chunks (many items). Output = same number of items, each item containing both chunk fields and embedding fields (e.g. `pageContent`, `documentId`, `embedding`).
- **Merge Query + Embed:** Input 1 = Pass Query + DocId (one item: query + documentId), Input 2 = Google Embed Query (one item: query embedding). Output = one item with query, documentId, and embedding, which “Build Chroma Query” then uses.

So: **Merge = “zip” two streams of items by position.** No “Fields to Match” needed when using “Merge by Position.”

---

### 5. Aggregating many items: Code that uses `$input.all()`

**What it does:** Some nodes receive **many items** (e.g. after Merge we have one item per chunk+embedding). We sometimes need to **collapse** them into **one** payload for one API call.

**What you learn:**

- **Build Chroma Add** runs after Merge. It gets N items (chunk + embedding per item). It does:
  - `const items = $input.all();`
  - Loops over `items`, collects `ids`, `embeddings`, `metadatas`, `documents`
  - Returns **one** item: `return [{ json: { ids, embeddings, metadatas, documents, documentId } }];`
- So the next node (Chroma Add) runs **once** with one big body, not N times.

**Pattern:** “Many items in → process in Code → one item out” is how we batch for Chroma’s `/add` API.

---

### 6. Sending the response back: Respond to Webhook

**What it does:** When the workflow is triggered by a Webhook, this node **sends the HTTP response** to the client. The client (our backend) is waiting for this.

**What you learn:**

- **Respond to Webhook** must run in the same execution as the Webhook trigger. The Webhook is configured to “respond via node,” so it waits for this node.
- **Body:** We set the response body with an expression, e.g. `={{ { answer: $json.choices?.[0]?.message?.content ?? '' } }}` so the client gets `{ "answer": "..." }`.
- If an error happens **before** Respond to Webhook, the client may get no body or an error; so error handling in earlier nodes (and not throwing past Respond to Webhook) matters.

---

## How Data Flows in This Workflow

A simple way to see it:

1. **Webhook** → 1 item (request body).
2. **Extract Body** → 1 item `{ text, query, documentId }`.
3. **Chunk Text** → N items (one per chunk), each `{ pageContent, documentId, chunkIndex }`.
4. **Chunk Text** also connects to **Merge** (Input 1). **Google Embed Chunks** runs N times (one per chunk), outputs N items → **Merge** (Input 2). **Merge** → N items (chunk + embedding each).
5. **Build Chroma Add** → N items in, 1 item out `{ ids, embeddings, metadatas, documents }`.
6. **Chroma Add** → 1 POST to Chroma.
7. **Pass Query + DocId** → 1 item `{ query, documentId }`. That goes to **Google Embed Query** (1 request) and to **Merge** (Input 1). **Google Embed Query** → 1 item → **Merge** (Input 2). **Merge** → 1 item (query + documentId + embedding).
8. **Build Chroma Query** → 1 item with `chromaQueryBody` and `query`.
9. **Chroma Query** → 1 POST, returns retrieved chunks.
10. **Build Groq Prompt** → builds prompt from chunks + query.
11. **Groq Generate** → 1 POST to Groq, returns answer.
12. **Respond to Webhook** → sends `{ answer }` back to the client.

So: **one execution = one request from the app, one response from n8n**, with branching (Chunk Text → Merge + Embed), merging (Merge), and batching (Build Chroma Add) along the way.

---

## n8n Concepts You’ve Seen

| Concept | Where in this project |
|--------|------------------------|
| **Trigger** | Webhook node starts the run when the app POSTs. |
| **Items and `json`** | Every node consumes/produces items with `json`; we read `$input.first().json`, `$json`, and return `[{ json: { ... } }]`. |
| **Expressions** | `={{ ... }}` in HTTP body/headers, Respond to Webhook body, using `$json`, `$('Node Name').first().json`. |
| **Referencing other nodes** | `$('Extract Body').first().json` in Code nodes to get `documentId`, `query`. |
| **One-in many-out** | Chunk Text: 1 item in → N items out. |
| **Many-in one-out** | Build Chroma Add: N items in → 1 item out. |
| **Branching** | Chunk Text connects to both Merge and Google Embed Chunks; Pass Query + DocId connects to both Merge and Google Embed Query. |
| **Merge** | Two inputs combined by position to pair chunks with embeddings, and query with query-embedding. |
| **HTTP Request** | Gemini (embed), Chroma (add/query), Groq (generate). |
| **Respond to Webhook** | Sends the final `{ answer }` back so the app can show it. |

---

## Tips for Editing This Workflow

1. **Node names:** Expressions like `$('Extract Body')` depend on the **exact node name**. Rename a node and you must update every reference.
2. **Test with “Execute step”:** Run one node to see input/output items. Use “Execute workflow” to run from the trigger (you’ll need to POST to the webhook or use the test panel).
3. **Production URL:** When the workflow is **Active**, the webhook URL is `/webhook/document-review`. For testing in the editor, you may see `/webhook-test/...`. The app must call the production URL.
4. **Docker and Chroma:** If n8n runs in Docker, use `http://host.docker.internal:8010` (or your host) for Chroma so the container can reach the server on your machine.

---

## What to Try Next

- **Add a node:** e.g. a **Set** node after Extract Body to add a `timestamp` field and see how it flows.
- **Change chunk size:** In the Chunk Text Code node, change `CHUNK_SIZE` and `CHUNK_OVERLAP` and run again.
- **Log something:** In any Code node, you can `console.log(...)` and see it in the execution log (if your n8n is set up to show logs).
- **Another trigger:** Duplicate the workflow and try a **Schedule** or **Manual** trigger instead of Webhook, and adapt the first Code node to the new input shape.

Using this project as a reference, you can open the workflow in n8n, click each node, and map what you see in the UI to the ideas above. That’s how you learn n8n by doing.
