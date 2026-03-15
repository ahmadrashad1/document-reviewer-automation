# Debug: Chunk Missing in Workflow

## Problem

The chunk data is not reaching the Format node. The merge node is returning an error because it can't find the chunk.

## Root Cause Analysis

The workflow structure is likely:
```
Chunk Document
  ↓ { chunk, chunkId }
Code Node (Preserve Data)
  ↓ { chunk, chunkId, query }
HTTP Request (Ollama Embeddings)
  ↓ { embedding } ← chunk is lost here!
Merge Node
  ↓ { error: "Chunk missing" }
Format Node
  ↓ Error
```

## Solution: Fix the Code Node After Chunking

The Code node after chunking must preserve ALL data. Use this code:

```javascript
// Code Node: "Preserve Chunk Data"
// Place this AFTER "Chunk Document" and BEFORE "HTTP Request (Embeddings)"

return items.map(item => ({
  json: {
    // Preserve all original chunk data
    chunk: item.json.chunk || item.json.text || item.json.content,
    chunkId: item.json.chunkId || item.json.id,
    query: item.json.query || "",
    // Add prompt for embedding request
    prompt: item.json.chunk || item.json.text || item.json.content
  }
}));
```

## Then Configure HTTP Request Properly

In your HTTP Request (Ollama Embeddings) node:

1. **Request Body:** Use `{{$json.prompt}}` for the embedding request
2. **Response Handling:** Make sure the response is merged with input

**OR** use a Code node AFTER HTTP Request to merge:

```javascript
// Code Node: "Merge Embedding with Chunk"
// Place this AFTER "HTTP Request (Embeddings)"

return items.map((item, index) => {
  // Get original chunk from input
  const inputItems = $input.all();
  const originalItem = inputItems && inputItems[index] ? inputItems[index] : null;
  
  return {
    json: {
      chunk: originalItem ? (originalItem.json.chunk || originalItem.json.text) : item.json.chunk,
      query: originalItem ? originalItem.json.query : item.json.query || "",
      chunkId: originalItem ? originalItem.json.chunkId : item.json.chunkId,
      embedding: item.json.embedding || item.json.response?.embedding
    }
  };
});
```

## Complete Workflow Structure

**Correct Flow:**
```
Webhook
  ↓ { documentText, query }
Chunk Document
  ↓ [{ chunk, chunkId }, { chunk, chunkId }, ...]
Code Node: "Preserve Chunk Data"
  ↓ [{ chunk, chunkId, query, prompt }, ...]
HTTP Request: "Ollama Embeddings"
  ↓ [{ chunk, chunkId, query, embedding }, ...] ← All data preserved
Merge Node
  ↓ [{ chunk, query, chunkId, embedding }, ...]
Format for Chroma
  ↓ [{ ids, documents, embeddings }, ...]
HTTP Request: "Store in Chroma"
```

## Quick Fix: Update Format Node

Use the fixed Format node code that tries to get chunk from input:

```javascript
return items.map((item, index) => {
  let chunk = item.json.chunk || item.json.text || item.json.content;
  let chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  let embedding = item.json.embedding;
  
  // If chunk missing, get from input
  if (!chunk) {
    const inputItems = $input.all();
    if (inputItems && inputItems.length > index) {
      const inputItem = inputItems[index];
      chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
      chunkId = inputItem.json.chunkId || inputItem.json.id || chunkId;
    }
  }
  
  if (!chunk) {
    throw new Error(`Chunk missing. Available: ${Object.keys(item.json).join(', ')}`);
  }
  
  return {
    json: {
      ids: [chunkId],
      documents: [chunk],
      embeddings: [embedding]
    }
  };
});
```

## Debug: Check What's Available

Add this debug code temporarily to see what data is available:

```javascript
return items.map((item, index) => {
  const inputItems = $input.all();
  
  return {
    json: {
      _debug: {
        currentItemFields: Object.keys(item.json),
        inputItemFields: inputItems && inputItems[0] ? Object.keys(inputItems[0].json) : [],
        hasChunkInCurrent: !!item.json.chunk,
        hasChunkInInput: inputItems && inputItems[0] ? !!(inputItems[0].json.chunk) : false
      },
      ...item.json
    }
  };
});
```

This will show you where the chunk data actually is.




