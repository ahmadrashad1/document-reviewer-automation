# Fix: Query String is Empty in Merge Node

## Problem

The `query` field is empty (`""`) in your merged output because the query is not being passed through the workflow to each chunk item.

## Why This Happens

In a typical workflow:
1. **Webhook** receives: `{ documentText, query }`
2. **Chunk Document** node processes `documentText` → creates multiple chunk items
3. **Embeddings** node processes each chunk → adds embeddings
4. **Merge** node combines chunks + embeddings

**The issue:** The `query` is only in the initial webhook input, not in each chunk item.

## Solutions

### Solution 1: Pass Query Through Each Node (Recommended)

**In your "Chunk Document" node (or the node that creates chunks):**

Make sure the query is included in each chunk item:

```javascript
// After chunking, add query to each chunk
return items.map(item => ({
  json: {
    ...item.json,
    query: $input.first().json.query, // Get query from webhook
    chunk: item.json.chunk,
    chunkId: item.json.chunkId || item.json.id
  }
}));
```

**Or if using a Code node after chunking:**

```javascript
// Get query from the first input item (webhook)
const query = $input.first().json.query;

// Add query to each chunk
return items.map((item, index) => ({
  json: {
    chunk: item.json.chunk || item.json.text,
    query: query, // Add query here
    chunkId: item.json.chunkId || item.json.id || `chunk_${index}`
  }
}));
```

### Solution 2: Get Query in Merge Node

Use the code in `n8n-merge-with-query.js` which tries multiple methods to find the query:

```javascript
return items.map((item, index) => {
  // Try to get query from first input (webhook)
  let query = "";
  try {
    const firstItem = $input.first();
    query = firstItem.json.query || "";
  } catch (e) {
    // Try current item
    query = item.json.query || "";
  }
  
  return {
    json: {
      chunk: item.json.chunk || item.json.text || item.json.content,
      query: query,
      chunkId: item.json.chunkId || item.json.id || `chunk_${index}`,
      embedding: item.json.embedding
    }
  };
});
```

### Solution 3: Store Query in Workflow Variable

**In your webhook node or first node:**

```javascript
// Store query in workflow variable
$workflow.variables.query = $input.first().json.query;
```

**In your merge node:**

```javascript
return items.map((item, index) => {
  const query = $workflow.variables.query || "";
  
  return {
    json: {
      chunk: item.json.chunk || item.json.text,
      query: query,
      chunkId: item.json.chunkId || item.json.id || `chunk_${index}`,
      embedding: item.json.embedding
    }
  };
});
```

### Solution 4: Use Set Node to Add Query

Add a **Set** node after chunking that adds the query to each item:

1. Add a **Set** node after "Chunk Document"
2. Set field: `query`
3. Value: `{{ $json.query }}` or `{{ $('Webhook').item.json.query }}`

## Recommended Workflow Structure

```
Webhook
  ↓
  { documentText, query }
  ↓
Chunk Document
  ↓
  [ { chunk, chunkId }, { chunk, chunkId }, ... ]
  ↓
Code Node (Add Query) ← ADD THIS
  ↓
  [ { chunk, chunkId, query }, { chunk, chunkId, query }, ... ]
  ↓
HTTP Request (Ollama Embeddings)
  ↓
  [ { chunk, chunkId, query, embedding }, ... ]
  ↓
Merge/Code Node
  ↓
  [ { chunk, query, chunkId, embedding }, ... ]
```

**Code for "Add Query" node:**

```javascript
// Get query from webhook (first input)
const query = $input.first().json.query;

// Add query to each chunk item
return items.map(item => ({
  json: {
    ...item.json,
    query: query
  }
}));
```

## Quick Fix

The easiest solution is to add a Code node after chunking that adds the query:

1. **Add a Code/JavaScript node** after your "Chunk Document" node
2. **Name it:** "Add Query to Chunks"
3. **Use this code:**

```javascript
const query = $input.first().json.query;

return items.map(item => ({
  json: {
    ...item.json,
    query: query
  }
}));
```

This ensures every chunk item has the query before it goes to embeddings and merge.

## Testing

After implementing the fix, test by:
1. Sending a request with `query: "test query"`
2. Checking that each merged item has `query: "test query"` (not empty)




