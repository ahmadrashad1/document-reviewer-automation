# Fix for n8n JavaScript Code - Merging Chunks and Embeddings

## Problem

Error: `Referenced node doesn't exist` when trying to access `$items("Chunk Document", 0, index)`

This happens because:
1. The node name might be incorrect (case-sensitive, spacing, or special characters)
2. The node might not be accessible from the current execution context
3. The syntax for accessing items might be wrong

## Solution Options

### Option 1: Use Correct Node Name (Recommended)

First, check the exact name of your "Chunk Document" node in n8n. Node names are case-sensitive.

**Corrected Code:**
```javascript
// Make sure "Chunk Document" matches exactly (case-sensitive)
// If your node is named differently, change it here
const chunkNodeName = "Chunk Document"; // Update this to match your actual node name

return items.map((item, index) => {
  const chunkData = $items(chunkNodeName, 0, index);
  
  if (!chunkData || chunkData.length === 0) {
    throw new Error(`No chunk data found at index ${index}`);
  }
  
  return {
    json: {
      chunk: chunkData[0].json.chunk,
      query: chunkData[0].json.query,
      chunkId: chunkData[0].json.chunkId,
      embedding: item.json.embedding
    }
  };
});
```

### Option 2: Use Input Items Directly (If Chunks Come from Previous Node)

If the chunks are coming from the previous node in the workflow:

```javascript
// Access items from the input (previous node)
const inputItems = $input.all();

return items.map((item, index) => {
  // Make sure index is within bounds
  if (index >= inputItems.length) {
    throw new Error(`Index ${index} out of bounds. Only ${inputItems.length} items available.`);
  }
  
  const chunkData = inputItems[index].json;
  
  return {
    json: {
      chunk: chunkData.chunk,
      query: chunkData.query,
      chunkId: chunkData.chunkId,
      embedding: item.json.embedding
    }
  };
});
```

### Option 3: Use $input.item() for Current Item's Input

If you're trying to access the input that created the current item:

```javascript
return items.map((item, index) => {
  // Get the input item that corresponds to this embedding
  const inputItem = $input.item(index);
  
  return {
    json: {
      chunk: inputItem.json.chunk,
      query: inputItem.json.query,
      chunkId: inputItem.json.chunkId,
      embedding: item.json.embedding
    }
  };
});
```

### Option 4: Store Data in Item Context (Most Reliable)

If you're processing chunks and then getting embeddings, pass the chunk data through:

**In the node before embeddings:**
```javascript
// Add chunk data to each item so it's available later
return items.map(item => ({
  json: {
    ...item.json,
    // Keep original chunk data
    chunk: item.json.chunk,
    query: item.json.query,
    chunkId: item.json.chunkId
  }
}));
```

**Then in the merge node:**
```javascript
// Simply combine the data that's already in the items
return items.map(item => ({
  json: {
    chunk: item.json.chunk,
    query: item.json.query,
    chunkId: item.json.chunkId,
    embedding: item.json.embedding
  }
}));
```

## How to Find the Correct Node Name

1. In n8n, click on the node that contains your chunk data
2. Look at the node's title/name at the top
3. Copy the exact name (including spaces, capitalization, etc.)
4. Use that exact name in your JavaScript code

## Debugging Tips

### Check Available Nodes
```javascript
// This won't work in n8n, but helps understand the structure
// The node name must match exactly as shown in the workflow
```

### Add Error Handling
```javascript
return items.map((item, index) => {
  try {
    const chunkData = $items("Chunk Document", 0, index);
    
    if (!chunkData || chunkData.length === 0) {
      console.error(`No data at index ${index}`);
      return {
        json: {
          error: `No chunk data at index ${index}`,
          embedding: item.json.embedding
        }
      };
    }
    
    return {
      json: {
        chunk: chunkData[0].json.chunk,
        query: chunkData[0].json.query,
        chunkId: chunkData[0].json.chunkId,
        embedding: item.json.embedding
      }
    };
  } catch (error) {
    return {
      json: {
        error: error.message,
        index: index,
        embedding: item.json.embedding
      }
    };
  }
});
```

## Recommended Approach

**Best Practice:** Pass data through the workflow instead of referencing other nodes.

1. **After Chunking Node:** Keep all chunk data in the items
2. **After Embedding Node:** The embedding is added to each item
3. **In Merge Node:** Simply combine the fields that are already in `item.json`

This avoids node reference issues and makes the workflow more reliable.

## Example: Complete Flow

**Node 1: Chunk Document**
```javascript
// Output: { chunk, query, chunkId }
```

**Node 2: HTTP Request (Ollama Embeddings)**
- Input: Items from Node 1
- Process each chunk to get embedding
- Output: Items with embedding added

**Node 3: Merge (JavaScript)**
```javascript
// All data is already in item.json
return items.map(item => ({
  json: {
    chunk: item.json.chunk,
    query: item.json.query,
    chunkId: item.json.chunkId,
    embedding: item.json.embedding
  }
}));
```

## Quick Fix

Try this simplified version first:

```javascript
return items.map((item) => {
  return {
    json: {
      chunk: item.json.chunk || item.json.text,
      query: item.json.query,
      chunkId: item.json.chunkId || item.json.id,
      embedding: item.json.embedding
    }
  };
});
```

This assumes the chunk data is already in the current items (from the previous node).




