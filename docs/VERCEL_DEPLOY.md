# Deploying the Document Reviewer with Vercel

This project has a **React (Vite) frontend** and a **Node/Express backend**. Vercel is great for the frontend; the backend needs to run elsewhere (or as Vercel serverless with some changes).

---

## Option A: Frontend on Vercel + Backend elsewhere (recommended)

### 1. Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New Project** → **Import** your repo: `ahmadrashad1/document-reviewer-automation`.
3. Configure the project:
   - **Root Directory:** leave as `.` or set to `frontend` (see below).
   - **Framework Preset:** Vite (Vercel usually detects it).
   - **Build Command:** `npm run build` (default for Vite).
   - **Output Directory:** `dist` (Vite default).
   - **Install Command:** `npm install`.

   **If the repo root is the monorepo (not `frontend`):**
   - Set **Root Directory** to `frontend`.
   - Then Build / Output stay as above.

4. **Environment variable** (required so the app calls your backend in production):
   - Name: `VITE_BACKEND_URL`
   - Value: your **backend’s public URL** (e.g. `https://your-backend.railway.app` or `https://your-backend.onrender.com`).
   - Add it in **Project Settings → Environment Variables** (for Production, and optionally Preview).

5. Deploy. Vercel will build the frontend and host it; the app will use `VITE_BACKEND_URL` for all API calls.

### 2. Run the backend somewhere else

The backend (Express, file uploads, PDF parsing, n8n webhook) is not on Vercel. Deploy it to one of:

- **Railway:** [railway.app](https://railway.app) – connect the repo, set root to `ai-doc-backend`, add env vars `PORT`, `N8N_WEBHOOK_URL` (your n8n webhook URL, e.g. from n8n cloud or a hosted n8n).
- **Render:** [render.com](https://render.com) – create a Web Service from the repo (root `ai-doc-backend`), set `PORT` and `N8N_WEBHOOK_URL`.
- **Fly.io:** [fly.io](https://fly.io) – deploy the backend with a `Dockerfile` or `fly.toml`.

After the backend is live, set `VITE_BACKEND_URL` on Vercel to that backend URL (with `https://` and no trailing slash).

---

## Option B: Only the frontend on Vercel (no backend in cloud)

If you don’t deploy the backend:

- Set **Root Directory** to `frontend`.
- Set `VITE_BACKEND_URL` to your **local or self-hosted backend** (e.g. `http://localhost:5000` for local dev).  
  Note: in production, the browser will call that URL; it only works if users can reach it (e.g. same network or you expose it).

For a real production setup, you still need the backend (and optionally n8n) hosted somewhere and then use that URL as `VITE_BACKEND_URL`.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Import `ahmadrashad1/document-reviewer-automation` in Vercel. |
| 2 | Set **Root Directory** to `frontend` (if repo root is the monorepo). |
| 3 | Add env var **VITE_BACKEND_URL** = your backend’s public URL. |
| 4 | Deploy backend (Railway / Render / Fly.io) and use its URL in `VITE_BACKEND_URL`. |

Repo: [github.com/ahmadrashad1/document-reviewer-automation](https://github.com/ahmadrashad1/document-reviewer-automation)
