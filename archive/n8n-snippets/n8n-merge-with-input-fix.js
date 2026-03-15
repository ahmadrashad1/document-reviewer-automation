// n8n Merge Code - FIXED VERSION
// This gets chunk from input items (before embeddings were added)

return items.map((item, index) => {
  // The current item has embedding, but chunk might be in input
  let chunk = item.json.chunk || item.json.text || item.json.content;
  let query = item.json.query || "";
  let chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  
  // If chunk not in current item, get from input items
  if (!chunk) {
    try {
      const inputItems = $input.all();
      if (inputItems && inputItems.length > index) {
        const inputItem = inputItems[index];
        chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
        query = inputItem.json.query || query;
        chunkId = inputItem.json.chunkId || inputItem.json.id || chunkId;
      }
    } catch (e) {
      // Try first input for query
      try {
        const firstInput = $input.first();
        query = firstInput.json.query || query;
      } catch (e2) {}
    }
  }
  
  // Get query from first input if still missing
  if (!query) {
    try {
      const firstInput = $input.first();
      query = firstInput.json.query || "";
    } catch (e) {}
  }
  
  // Validate
  if (!chunk) {
    return {
      json: {
        error: `Chunk missing at index ${index}`,
        availableFields: Object.keys(item.json),
        chunkId: chunkId,
        query: query,
        embedding: item.json.embedding
      }
    };
  }
  
  if (!item.json.embedding || !Array.isArray(item.json.embedding)) {
    return {
      json: {
        error: `Embedding missing or invalid`,
        chunk: chunk,
        chunkId: chunkId,
        query: query
      }
    };
  }
  
  // Return merged data
  return {
    json: {
      chunk: chunk,
      query: query,
      chunkId: chunkId,
      embedding: item.json.embedding
    }
  };
});




