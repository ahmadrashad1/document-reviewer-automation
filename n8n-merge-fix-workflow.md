# Fix: Chunk Missing - Workflow Structure Issue

## Problem

The error "Chunk missing at index 0" means the chunk data is not reaching the merge node. The INPUT only shows `embedding`, not the chunk data.

## Root Cause

The workflow structure is likely:
```
Chunk Document → HTTP Request (Embeddings) → Merge
```

But the chunk data is lost between "Chunk Document" and "HTTP Request" because the HTTP Request only returns embeddings, not the original chunk.

## Solutions

### Solution 1: Fix Workflow Structure (Recommended)

**Current (Broken):**
```
Chunk Document
  ↓ { chunk, chunkId }
HTTP Request (Embeddings)
  ↓ { embedding }  ← chunk is lost!
Merge
  ↓ Error: chunk missing
```

**Fixed Structure:**
```
Chunk Document
  ↓ { chunk, chunkId, query }
Code Node (Prepare for Embeddings)
  ↓ { chunk, chunkId, query }  ← Keep chunk data
HTTP Request (Embeddings)
  ↓ { chunk, chunkId, query, embedding }  ← Add embedding, keep chunk
Merge
  ↓ { chunk, query, chunkId, embedding }  ← All data present
```

### Solution 2: Configure HTTP Request to Keep Original Data

In your HTTP Request node for embeddings:

1. Go to **Options** → **Response**
2. Enable **"Include Response Headers and Status"** (optional)
3. In your HTTP Request node, make sure it's configured to preserve input data

**OR** use a Code node before HTTP Request to prepare the data:

```javascript
// Before HTTP Request - Keep chunk data
return items.map(item => ({
  json: {
    ...item.json,  // Keep all original data
    prompt: item.json.chunk || item.json.text  // For embeddings API
  }
}));
```

Then in HTTP Request, use `{{$json.prompt}}` for the embedding request, and the response will be added to the item.

### Solution 3: Use HTTP Request Response Format

Configure your HTTP Request node to merge the response with input:

1. In HTTP Request node
2. **Options** → **Response Format**: JSON
3. The response should merge with input items automatically

**OR** use a Code node after HTTP Request to merge:

```javascript
// After HTTP Request - Merge embedding with chunk
return items.map((item, index) => {
  // Get original chunk from input
  const inputItems = $input.all();
  const originalChunk = inputItems && inputItems[index] 
    ? (inputItems[index].json.chunk || inputItems[index].json.text)
    : null;
  
  return {
    json: {
      chunk: originalChunk || item.json.chunk,
      query: inputItems && inputItems[0] ? inputItems[0].json.query : "",
      chunkId: item.json.chunkId || `chunk_${index}`,
      embedding: item.json.embedding || item.json.response?.embedding
    }
  };
});
```

### Solution 4: Use Set Node to Preserve Data

Add a **Set** node before HTTP Request:

1. Add **Set** node after "Chunk Document"
2. Set it to **"Keep Only Set Fields"** = OFF
3. This preserves all original fields
4. HTTP Request will add embedding to existing data

## Recommended Fix

**Best approach:** Add a Code node BEFORE the HTTP Request to preserve chunk data:

```javascript
// Code Node: "Preserve Chunk Data"
// Place this BEFORE HTTP Request (Embeddings)

return items.map(item => ({
  json: {
    chunk: item.json.chunk || item.json.text || item.json.content,
    chunkId: item.json.chunkId || item.json.id,
    query: item.json.query || "",
    // This will be used for embedding request
    prompt: item.json.chunk || item.json.text || item.json.content
  }
}));
```

Then in your HTTP Request:
- Use `{{$json.prompt}}` for the embedding request
- The response will be added to the item
- All original fields (chunk, chunkId, query) will be preserved

Then your merge node can simply:

```javascript
return items.map(item => ({
  json: {
    chunk: item.json.chunk,
    query: item.json.query || "",
    chunkId: item.json.chunkId,
    embedding: item.json.embedding
  }
}));
```

## Debug First

Use `n8n-merge-debug-chunk.js` first to see what data is actually available, then apply the appropriate fix.




