// n8n Merge Node - FINAL FIX
// This MUST get chunk from input items (before embeddings were added)

return items.map((item, index) => {
  // Current item has embedding, but chunk is in the INPUT (before embeddings)
  let chunk = null;
  let query = "";
  let chunkId = item.json.chunkId || `chunk_${index}`;
  const embedding = item.json.embedding;
  
  // CRITICAL: Get chunk from input items (the items BEFORE embeddings)
  try {
    const inputItems = $input.all();
    
    if (inputItems && inputItems.length > index) {
      const inputItem = inputItems[index];
      chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
      query = inputItem.json.query || "";
      chunkId = inputItem.json.chunkId || inputItem.json.id || chunkId;
    } else if (inputItems && inputItems.length > 0) {
      // Try first item if index doesn't match
      const firstItem = inputItems[0];
      chunk = firstItem.json.chunk || firstItem.json.text || firstItem.json.content;
      query = firstItem.json.query || "";
    }
  } catch (e) {
    // If that fails, try first input
    try {
      const firstInput = $input.first();
      chunk = firstInput.json.chunk || firstInput.json.text || firstInput.json.content;
      query = firstInput.json.query || "";
      chunkId = firstInput.json.chunkId || firstInput.json.id || chunkId;
    } catch (e2) {
      // Still no chunk
    }
  }
  
  // Get query from first input if still missing (from webhook)
  if (!query) {
    try {
      const firstInput = $input.first();
      query = firstInput.json.query || "";
    } catch (e) {}
  }
  
  // Validate - this is critical
  if (!chunk) {
    // Return error but include embedding so Format node can recover
    return {
      json: {
        error: `Chunk missing at index ${index}`,
        availableFields: Object.keys(item.json),
        chunkId: chunkId,
        query: query,
        embedding: embedding // Keep embedding so Format can recover
      }
    };
  }
  
  if (!embedding || !Array.isArray(embedding)) {
    return {
      json: {
        error: `Embedding missing or invalid at index ${index}`,
        chunk: chunk,
        chunkId: chunkId,
        query: query
      }
    };
  }
  
  // Success - return merged data
  return {
    json: {
      chunk: chunk,
      query: query,
      chunkId: chunkId,
      embedding: embedding
    }
  };
});




