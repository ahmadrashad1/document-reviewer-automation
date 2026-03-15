# Fix: $input.item is not a function

## Problem

The error `$input.item is not a function` occurs because `$input.item()` is not available in all n8n versions or contexts.

## Solution: Use $input.all() instead

Instead of:
```javascript
const inputItem = $input.item(index); // ❌ Doesn't work
```

Use:
```javascript
const inputItems = $input.all(); // ✅ Gets all input items
const inputItem = inputItems[index]; // ✅ Access by index
```

## Working Code

### Option 1: Simple Version (if chunk is in current items)

```javascript
return items.map((item, index) => {
  const chunk = item.json.chunk || item.json.text || item.json.content;
  const query = item.json.query || "";
  const chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  
  return {
    json: {
      chunk: chunk,
      query: query,
      chunkId: chunkId,
      embedding: item.json.embedding
    }
  };
});
```

### Option 2: With Input Access (if chunk is in previous node)

```javascript
return items.map((item, index) => {
  // Try current item first
  let chunk = item.json.chunk || item.json.text || item.json.content;
  let query = item.json.query || "";
  let chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  
  // If not found, get from input items
  if (!chunk) {
    const inputItems = $input.all();
    if (inputItems && inputItems.length > index) {
      const inputItem = inputItems[index];
      chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
      query = inputItem.json.query || query;
      chunkId = inputItem.json.chunkId || inputItem.json.id || chunkId;
    }
  }
  
  // Get query from first input if still missing
  if (!query) {
    try {
      const firstInput = $input.first();
      query = firstInput.json.query || "";
    } catch (e) {
      // Ignore
    }
  }
  
  return {
    json: {
      chunk: chunk,
      query: query,
      chunkId: chunkId,
      embedding: item.json.embedding
    }
  };
});
```

## n8n Input Methods

Available methods in n8n Code nodes:

- ✅ `$input.all()` - Returns array of all input items
- ✅ `$input.first()` - Returns first input item
- ✅ `$input.last()` - Returns last input item
- ❌ `$input.item(index)` - **NOT AVAILABLE** in all versions

## Debugging: Check What's Available

If you're not sure what data is available, use this debug code:

```javascript
return items.map((item, index) => {
  const debug = {
    currentItemFields: Object.keys(item.json),
    hasEmbedding: !!item.json.embedding,
    inputItemsCount: 0,
    inputItemFields: []
  };
  
  try {
    const inputItems = $input.all();
    debug.inputItemsCount = inputItems ? inputItems.length : 0;
    if (inputItems && inputItems.length > index) {
      debug.inputItemFields = Object.keys(inputItems[index].json);
    }
  } catch (e) {
    debug.inputError = e.message;
  }
  
  return {
    json: {
      ...item.json,
      _debug: debug
    }
  };
});
```

This will show you what fields are available in both current items and input items.

## Recommended Approach

**Best practice:** Pass all needed data through the workflow so it's always in `item.json`:

1. **After chunking:** Include chunk, query, chunkId in each item
2. **After embeddings:** Embedding is added to each item
3. **In merge:** Simply combine fields from `item.json`

This avoids needing to access input items at all.




