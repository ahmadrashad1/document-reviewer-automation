# Using Groq (free online LLM) instead of Ollama

The Document Reviewer workflow uses **Groq's free API** so you don't need local GPU/memory.

## 1. Get a free Groq API key

1. Go to **https://console.groq.com**
2. Sign up (free).
3. Open **API Keys**: https://console.groq.com/keys
4. Create a key and copy it.

## 2. Set the key in n8n

In the **Groq Generate** (HTTP Request) node:

- **Send Headers** → **Authorization**  
  Replace `YOUR_GROQ_API_KEY` with your real key:
  - Value: `Bearer gsk_xxxxxxxxxxxxxxxx` (your key after `Bearer `)

Options:

- **Option A:** Edit the header value in the node and paste your key.
- **Option B:** In n8n **Settings** → **Variables**, add `GROQ_API_KEY` and in the node use expression:  
  `Bearer {{ $env.GROQ_API_KEY }}`  
  (if your n8n version supports `$env`).
- **Option C:** Use n8n **Credentials** (e.g. Header Auth) and reference it in the HTTP Request node.

## 3. Model

The workflow uses **llama-3.1-8b-instant** on Groq. You can change the model in the **Code** node (`groqBody.model`), e.g. to `llama-3.3-70b-versatile` if available on your tier.

No Ollama or Docker LLM is required.
