// n8n Format for Chroma - FIXED VERSION
// This handles missing chunk by getting it from input items

return items.map((item, index) => {
  // Try to get chunk from current item first
  let chunk = item.json.chunk || item.json.text || item.json.content;
  let chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  let embedding = item.json.embedding;
  
  // If chunk is missing, try to get from input items (before merge)
  if (!chunk) {
    try {
      const inputItems = $input.all();
      if (inputItems && inputItems.length > index) {
        const inputItem = inputItems[index];
        chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
        chunkId = inputItem.json.chunkId || inputItem.json.id || chunkId;
        
        // If embedding is also missing, get it from current item
        if (!embedding) {
          embedding = inputItem.json.embedding;
        }
      }
    } catch (e) {
      // If that fails, try first input
      try {
        const firstInput = $input.first();
        chunk = firstInput.json.chunk || firstInput.json.text || firstInput.json.content;
        chunkId = firstInput.json.chunkId || firstInput.json.id || chunkId;
      } catch (e2) {
        // Still no chunk
      }
    }
  }
  
  // Validate required fields
  if (!chunk) {
    throw new Error(`Chunk is missing at index ${index}. Available fields in current item: ${Object.keys(item.json).join(', ')}. Check that chunk data is being passed through the workflow.`);
  }
  
  if (!chunkId) {
    throw new Error(`chunkId is missing at index ${index}`);
  }
  
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error(`Embedding is missing or invalid at index ${index}`);
  }
  
  // Format for Chroma API
  return {
    json: {
      ids: [chunkId],
      documents: [chunk],
      embeddings: [embedding]
    }
  };
});




