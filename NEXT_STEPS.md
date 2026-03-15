# Run on Windows (step-by-step)

Use **PowerShell**; run all commands from the **project root**. If n8n is not running yet, start it first (e.g. `.\scripts\start-n8n-docker.ps1`). Then follow these in order.

---

## 1. Open n8n and import the workflow

1. In your browser go to **http://localhost:5678**
2. **Workflows** → **Import from File** (or **Add workflow** → **Import**)
3. Select **`n8n-workflow-document-reviewer.json`** (in this project root)
4. Open the **Groq Generate** node and set **Authorization** to:
   ```text
   Bearer YOUR_GROQ_API_KEY
   ```
   Get a free key at: https://console.groq.com → API Keys
5. Click **Save** (top right), then turn the workflow **Active** (toggle in the **top-right** of the editor must be **ON**).  
   - **Important:** The **test** URL (`webhook-test/document-review`) only works when you trigger from inside n8n. The **production** URL (`webhook/document-review`) only works when the workflow is **Active**. The frontend/backend call the production URL, so the workflow must be active or you’ll get a 404 “webhook is not registered”.

---

## 2. Install and start the backend

In a terminal (project root):

```powershell
npm install --prefix ai-doc-backend
cd ai-doc-backend; npm start
```

Leave this running. Backend will use **http://localhost:5678/webhook/document-review** (already set in `ai-doc-backend/.env`).

---

## 3. Install and start the frontend

In a **second** terminal (project root):

```powershell
npm install --prefix frontend
cd frontend; npm run dev
```

---

## 4. Use the app

1. Open **http://localhost:3000** in your browser
2. Upload a PDF (e.g. `test.pdf`)
3. Enter a question (e.g. “What is this document about?”)
4. Click **Analyze Document**

The backend extracts text from the PDF, sends it to the n8n workflow, and the answer appears in the UI.

---

## Quick reference

| Service  | URL                  | Purpose              |
|----------|----------------------|----------------------|
| n8n      | http://localhost:5678 | Workflow editor      |
| Backend  | http://localhost:5000 | PDF → n8n            |
| Frontend | http://localhost:3000 | Upload PDF + query   |

If the frontend says it can’t connect, make sure the backend is running on port 5000.

---

## Troubleshooting: “webhook is not registered” (404)

If you see:

```text
The requested webhook "POST document-review" is not registered.
```

**Cause:** The workflow is not **Active**. n8n only accepts production webhook calls when the workflow is turned on.

**Fix:**

1. Open **http://localhost:5678** and open your Document Reviewer workflow.
2. In the **top-right** of the editor, find the **Active** toggle (Off / On).
3. Turn it **On** (Active).
4. **Save** the workflow if prompted.
5. Try the frontend again (upload PDF, query, Analyze Document).

- Use **Production** URL for the app: `http://localhost:5678/webhook/document-review` (already set in `ai-doc-backend/.env`).
- The **Test** URL `http://0.0.0.0:5678/webhook-test/document-review` is only for triggering from inside n8n; the backend does not use it.
