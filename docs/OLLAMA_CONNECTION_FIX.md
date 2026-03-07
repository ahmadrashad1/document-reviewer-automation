# Fix: "The service refused the connection - perhaps it is offline"

The HTTP Request node is trying to reach **Ollama** at `http://host.docker.internal:11434`. The error means that address is not accepting connections.

## 1. Make sure Ollama is running

On your **Windows host** (outside Docker):

1. Open a terminal and run:
   ```powershell
   ollama list
   ```
   If that fails, install and start [Ollama](https://ollama.com).

2. Pull the model you use in the workflow (e.g. llama3.1):
   ```powershell
   ollama pull llama3.1
   ```

3. In a browser, open: **http://localhost:11434**
   - If you see an Ollama message (e.g. "Ollama is running"), the server is up on the host.

## 2. Let Ollama accept connections from Docker (Windows)

By default Ollama may only listen on `127.0.0.1`, so the n8n **container** cannot reach it via `host.docker.internal`.

**Option A – Set env and restart Ollama (recommended)**

1. In **System** → **Environment variables**, add:
   - Name: `OLLAMA_HOST`
   - Value: `0.0.0.0`
2. Restart Ollama (quit from tray/taskbar and start again), then check http://localhost:11434 again.

**Option B – Run Ollama with the variable once**

In PowerShell (run as needed):

```powershell
$env:OLLAMA_HOST = "0.0.0.0"
ollama serve
```

Leave this window open while you use the workflow.

## 3. Use the right URL in n8n

- **Ollama in Docker** (recommended): If you use the `ollama` service in `docker-compose.yml`, in the HTTP Request node set the URL to  
  `http://ollama:11434/api/generate`.  
  Then run `docker compose up -d` and pull a model:  
  `docker exec ai-doc-ollama ollama pull llama3.1`

- **Ollama on host, n8n in Docker**: In the HTTP Request node use  
  `http://host.docker.internal:11434/api/generate`  
  and set `OLLAMA_HOST=0.0.0.0` on the host (see step 2).

- **n8n and Ollama both on host**: Use  
  `http://localhost:11434/api/generate`.

## 4. Quick check from the host

In PowerShell on the host:

```powershell
Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET
```

If this returns model info, Ollama is reachable on the host. After that, with `OLLAMA_HOST=0.0.0.0`, the n8n container should be able to use `http://host.docker.internal:11434/api/generate`.
