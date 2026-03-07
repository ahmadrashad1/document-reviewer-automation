# Fix: "JSON parameter needs to be valid JSON" in HTTP Request (Node 3)

If the error persists even with `={{ $json.ollamaBodyJson }}`, the JSON body validator in the node is still failing. Use **Raw** body instead so no JSON validation runs.

## In Node 3 (HTTP Request)

1. **Send Body:** leave **On**.
2. **Body Content Type:** change from **JSON** to **Raw**.
3. **Content-Type** (for Raw): set to `application/json`.
4. **Body:** use Expression and set to:
   ```
   ={{ $json.ollamaBodyJson }}
   ```

So the node sends the pre-built JSON **string** as the request body with `Content-Type: application/json`, and never parses it in the editor (no “valid JSON” check).

## Node 2 (Code) must output `ollamaBodyJson`

In the Code node, keep building and stringifying the body:

```javascript
const ollamaBody = { model: 'llama3.1', prompt, stream: false };
const ollamaBodyJson = JSON.stringify(ollamaBody);
return [{ json: { text, query, ollamaBody, ollamaBodyJson } }];
```

After this, Node 3 should run without the error.
