# Complete Fix for Chroma HTTP Request

## Problems Identified

1. **`documents` is `[null]`** - The `chunk` field is missing/null in the input
2. **Invalid JSON syntax** - `[={{$json.embedding}}]` is not valid JSON

## Solution: Use Code Node + Simple HTTP Request

### Step 1: Add/Update Code Node Before HTTP Request

Add a Code node named "Format for Chroma" with this code:

```javascript
return items.map(item => {
  // Get chunk - try multiple possible field names
  const chunk = item.json.chunk || item.json.text || item.json.content;
  
  if (!chunk) {
    throw new Error(`Chunk data is missing. Available fields: ${Object.keys(item.json).join(', ')}`);
  }
  
  const chunkId = item.json.chunkId || item.json.id || `chunk_${item.index}`;
  
  if (!item.json.embedding || !Array.isArray(item.json.embedding)) {
    throw new Error('Embedding is missing or not an array');
  }
  
  return {
    json: {
      ids: [chunkId],
      documents: [chunk],
      embeddings: [item.json.embedding]
    }
  };
});
```

### Step 2: Configure HTTP Request Node

In your HTTP Request node:

1. **Method:** POST
2. **URL:** `http://127.0.0.1:8000/api/v1/collections/documents/add`
3. **Body Content Type:** JSON
4. **Specify Body:** Using JSON
5. **JSON:** 
   ```json
   ={{$json}}
   ```

That's it! Just use `={{$json}}` - the Code node already formatted everything.

## Alternative: Fix JSON Expressions Directly

If you want to keep using expressions in the HTTP Request node (without Code node):

**Correct JSON body:**
```json
{
  "ids": ["={{$json.chunkId}}"],
  "documents": ["={{$json.chunk}}"],
  "embeddings": [{{JSON.stringify($json.embedding)}}]
}
```

**OR** if the above doesn't work:
```json
{
  "ids": {{JSON.stringify([$json.chunkId])}},
  "documents": {{JSON.stringify([$json.chunk])}},
  "embeddings": {{JSON.stringify([$json.embedding])}}
}
```

## Why Chunk is Null

The `chunk` field is null because it's not being passed through from your merge node. 

**Fix your merge node code to include chunk:**

```javascript
return items.map((item, index) => {
  // Get chunk from input item (previous node)
  const inputItem = $input.item(index);
  const chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
  
  if (!chunk) {
    throw new Error(`No chunk found at index ${index}`);
  }
  
  return {
    json: {
      chunk: chunk,  // Make sure chunk is included!
      query: inputItem.json.query || "",
      chunkId: inputItem.json.chunkId || inputItem.json.id || `chunk_${index}`,
      embedding: item.json.embedding
    }
  };
});
```

## Recommended Workflow

```
Merge Node (with chunk + embedding)
  ↓
Format for Chroma (Code Node) ← ADD THIS
  ↓ { ids: [...], documents: [...], embeddings: [...] }
HTTP Request to Chroma
  ↓ Body: ={{$json}}
```

## Testing

After applying the fix, the INPUT to your HTTP Request should show:
```json
{
  "ids": ["chunk_0"],
  "documents": ["actual chunk text here"],
  "embeddings": [[0.924, 0.685, ...]]
}
```

All three fields should have valid data (not null).




