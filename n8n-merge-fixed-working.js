// n8n Merge Code - WORKING VERSION
// This fixes the $input.item error and properly merges chunks + embeddings

return items.map((item, index) => {
  // Method 1: Try to get chunk from current item first
  let chunk = item.json.chunk || item.json.text || item.json.content;
  let query = item.json.query || "";
  let chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  
  // Method 2: If chunk not in current item, try to get from input
  if (!chunk) {
    try {
      // Get all input items
      const inputItems = $input.all();
      
      if (inputItems && inputItems.length > index) {
        const inputItem = inputItems[index];
        chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
        query = inputItem.json.query || query;
        chunkId = inputItem.json.chunkId || inputItem.json.id || chunkId;
      }
    } catch (e) {
      // If that fails, try first input item (might have query)
      try {
        const firstInput = $input.first();
        query = firstInput.json.query || query;
      } catch (e2) {
        // Ignore
      }
    }
  }
  
  // Method 3: Try to get query from first input (webhook)
  if (!query) {
    try {
      const firstInput = $input.first();
      query = firstInput.json.query || "";
    } catch (e) {
      // Ignore
    }
  }
  
  // Validate required fields
  if (!chunk) {
    return {
      json: {
        error: `Chunk data not found at index ${index}`,
        availableFields: Object.keys(item.json),
        embedding: item.json.embedding,
        chunkId: chunkId,
        query: query
      }
    };
  }
  
  if (!item.json.embedding || !Array.isArray(item.json.embedding)) {
    return {
      json: {
        error: `Embedding not found or invalid at index ${index}`,
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




