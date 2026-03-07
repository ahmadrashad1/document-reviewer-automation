# Complete Fix for Chroma Storage

## Current Issues

1. **Missing `chunk` field** - INPUT shows only `chunkId` and `embedding`, no `chunk`
2. **Invalid JSON syntax** - `[={{$json.embedding}}]` creates invalid JSON
3. **Preview shows** `"documents": ["="]` - chunk is null/missing

## Solution: Two-Step Fix

### Step 1: Fix Merge Node

Use this code in your "merge chunking + embedding" node:

```javascript
return items.map((item, index) => {
  // Get chunk from input items (from chunking node)
  let chunk = null;
  let query = "";
  let chunkId = item.json.chunkId || `chunk_${index}`;
  
  // Get all input items
  try {
    const inputItems = $input.all();
    if (inputItems && inputItems.length > index) {
      const inputItem = inputItems[index];
      chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
      query = inputItem.json.query || "";
      chunkId = inputItem.json.chunkId || inputItem.json.id || chunkId;
    }
  } catch (e) {
    // Try first input for query
    try {
      const firstInput = $input.first();
      query = firstInput.json.query || "";
    } catch (e2) {}
  }
  
  // Validate chunk exists
  if (!chunk) {
    throw new Error(`Chunk data missing at index ${index}. Available: ${Object.keys(item.json).join(', ')}`);
  }
  
  return {
    json: {
      chunk: chunk,  // ← CRITICAL: Must include this!
      query: query,
      chunkId: chunkId,
      embedding: item.json.embedding
    }
  };
});
```

### Step 2: Add Code Node Before HTTP Request

Add a Code node named "Format for Chroma" between merge and HTTP Request:

```javascript
return items.map(item => {
  // Validate all required fields
  if (!item.json.chunk) {
    throw new Error('Chunk is missing');
  }
  if (!item.json.chunkId) {
    throw new Error('chunkId is missing');
  }
  if (!item.json.embedding || !Array.isArray(item.json.embedding)) {
    throw new Error('Embedding is missing or invalid');
  }
  
  // Format for Chroma API
  return {
    json: {
      ids: [item.json.chunkId],
      documents: [item.json.chunk],
      embeddings: [item.json.embedding]
    }
  };
});
```

### Step 3: Simplify HTTP Request

In your HTTP Request node:
- **Body Content Type:** JSON
- **Specify Body:** Using JSON
- **JSON:** `={{$json}}`

That's it! The Code node already formatted everything correctly.

## Why This Works

1. **Merge node** retrieves chunk from input items and includes it in output
2. **Format node** structures data exactly as Chroma expects
3. **HTTP Request** just sends the formatted JSON

## Expected Result

After these fixes, your INPUT to HTTP Request should show:
```json
{
  "ids": ["chunk_0"],
  "documents": ["actual chunk text here"],
  "embeddings": [[0.924, 0.685, ...]]
}
```

All fields will have valid data (not null, not empty).

## Alternative: Fix JSON Expressions Directly

If you don't want to add a Code node, fix the JSON in HTTP Request:

```json
{
  "ids": {{JSON.stringify([$json.chunkId])}},
  "documents": {{JSON.stringify([$json.chunk])}},
  "embeddings": {{JSON.stringify([$json.embedding])}}
}
```

But the Code node approach is more reliable and easier to debug.




