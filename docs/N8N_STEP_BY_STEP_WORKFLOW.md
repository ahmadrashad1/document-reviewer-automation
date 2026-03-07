# Document Reviewer – Step-by-Step n8n Workflow (Node by Node)

Follow these steps in n8n to build the workflow from scratch. Every setting is listed.

---

## Before You Start

- Backend sends a **POST** with JSON: `{ "text": "<PDF text>", "query": "<user question>" }`.
- The workflow must return JSON that the frontend can show, e.g. `{ "answer": "<LLM response>" }`.
- **Ollama** must be running (e.g. `http://localhost:11434`). If n8n runs in **Docker**, use `http://host.docker.internal:11434` so the container can reach Ollama on the host.

---

## Step 1: Create the Workflow

1. Open n8n (e.g. **http://localhost:5678**).
2. Click **Add workflow** (or **Workflows** → **New workflow**).
3. Name it (e.g. **Document Reviewer**).

---

## Step 2: Node 1 – Webhook (Trigger)

1. Click **+** to add a node (or open the **+** menu).
2. Search for **Webhook** and add it.
3. Configure:

   | Field | Value |
   |-------|--------|
   | **HTTP Method** | `POST` |
   | **Path** | `document-review` |
   | **Response Mode** | `Using 'Respond to Webhook' Node` (or `When Last Node Finishes` depending on your n8n version) |
   | **Options** | Leave default |

4. **Path** is what you type in the path field; the full URL will be:
   - **Test:** `http://localhost:5678/webhook-test/document-review`
   - **Production (after activation):** `http://localhost:5678/webhook/document-review`

5. Leave the node open or click elsewhere. No need to connect it yet.

---

## Step 3: Node 2 – Extract Body (Code)

1. Add another node: search for **Code** and add **Code**.
2. Rename the node to **Extract Body** (optional but clear).
3. Set **Mode** to **Run Once for All Items** (so one output item).
4. In **JavaScript Code**, paste exactly (this also builds `ollamaBody` so the document text never breaks JSON in the next node):

```javascript
// Normalize input and build Ollama body so document text never breaks JSON
const raw = $input.first().json;
const body = raw.body ?? raw;
const text = body.text ?? body.documentText ?? '';
const query = body.query ?? '';

if (!text || !query) {
  throw new Error('Request body must include "text" and "query"');
}

const prompt = 'You are a document analyst. Use only the following document text to answer the question. If the answer is not in the text, say so.\n\nDocument text:\n' + text + '\n\nQuestion: ' + query + '\n\nAnswer (concise, plain text):';

const ollamaBody = {
  model: 'llama3.1',
  prompt,
  stream: false
};

return [{ json: { text, query, ollamaBody } }];
```

5. This node outputs **one item** with `text`, `query`, and **`ollamaBody`** (ready for the HTTP Request).

---

## Step 4: Node 3 – Ollama Generate (HTTP Request)

1. Add a node: search for **HTTP Request** and add it.
2. Rename to **Ollama Generate**.
3. Configure:

   | Field | Value |
   |-------|--------|
   | **Method** | `POST` |
   | **URL** | See below |
   | **Send Headers** | On |
   | **Header Name** | `Content-Type` |
   | **Header Value** | `application/json` |
   | **Send Body** | On |
   | **Body Content Type** | JSON |
   | **Specify Body** | Using JSON |

4. **URL:**
   - **n8n in Docker, Ollama on host:** `http://host.docker.internal:11434/api/generate`
   - **n8n and Ollama both on same machine:** `http://localhost:11434/api/generate`

5. **JSON Body** – use the expression below. In the body field, switch to **Expression** (or “Expression” tab) and paste:

```json
{
  "model": "llama3.1",
  "prompt": "You are a document analyst. Use only the following document text to answer the question. If the answer is not in the text, say so.\n\nDocument text:\n" + $json.text + "\n\nQuestion: " + $json.query + "\n\nAnswer (concise, plain text):",
  "stream": false
}
```

   - Replace `llama3.1` with your model name if different (e.g. `llama3.2`, `mistral`).
   - Ensure `$json.text` and `$json.query` refer to the output of **Extract Body**.

6. Ollama’s response will be in the form `{ "response": "<answer text>" }`. The next node will use `$json.response`.

---

## Step 5: Node 4 – Respond to Webhook

1. Add a node: search for **Respond to Webhook** and add it.
2. Configure:

   | Field | Value |
   |-------|--------|
   | **Respond With** | `JSON` |
   | **Response Body** | See below |
   | **Options** | Leave default |

3. **Response Body** – use an expression so the frontend gets an `answer` field. In the response body field, use **Expression** and enter:

```
{{ { answer: $json.response || '' } }}
```

   - This takes the LLM reply from the previous node (`$json.response`) and returns `{ "answer": "..." }`. The frontend already knows how to display `answer`.

4. **Important:** This node must be the one that sends the HTTP response for the Webhook. That’s why the Webhook was set to “Using 'Respond to Webhook' Node”.

---

## Step 6: Connect the Nodes

Connect in this order (drag from output dot of one node to input dot of the next):

1. **Webhook** → **Extract Body**
2. **Extract Body** → **Ollama Generate**
3. **Ollama Generate** → **Respond to Webhook**

Final chain:

**Webhook** → **Extract Body** → **Ollama Generate** → **Respond to Webhook**

---

## Step 7: Save and Activate

1. Click **Save** (top right).
2. Toggle **Active** to **On** (so the webhook is listening).
3. Open the **Webhook** node again and copy the **Production** webhook URL. It will look like:
   - `http://localhost:5678/webhook/document-review`
   - Or with your host/port: `https://your-domain.com/webhook/document-review`

---

## Step 8: Use the URL in the Backend

- If the backend runs on the **same machine** as n8n: set:
  - `N8N_WEBHOOK_URL=http://localhost:5678/webhook/document-review`
- If the backend runs **inside Docker** and n8n is the service name: set:
  - `N8N_WEBHOOK_URL=http://n8n:5678/webhook/document-review`

The backend already sends `{ text, query }` and forwards the webhook response to the frontend. No code changes needed.

---

## Summary Table

| # | Node | Purpose |
|---|------|---------|
| 1 | **Webhook** | Receives POST with `{ text, query }` |
| 2 | **Extract Body** | Puts `text` and `query` in one item; validates they exist |
| 3 | **Ollama Generate** | Sends prompt (document + question) to Ollama; returns `response` |
| 4 | **Respond to Webhook** | Sends back `{ "answer": "<response>" }` to the client |

---

## Quick Test (Optional)

With the workflow **Active**, you can test the webhook with curl:

```bash
curl -X POST http://localhost:5678/webhook/document-review \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"The company was founded in 2020. It sells software.\", \"query\": \"When was the company founded?\"}"
```

You should get a JSON response with an `answer` field containing the model’s answer.
