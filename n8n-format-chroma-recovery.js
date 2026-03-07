// n8n Format for Chroma - Recovery Version
// This handles error cases and tries to recover chunk from input

return items.map((item, index) => {
  // Skip error items - try to get data from input instead
  if (item.json.error) {
    // This item has an error, try to get data from input items
    try {
      const inputItems = $input.all();
      if (inputItems && inputItems.length > index) {
        const inputItem = inputItems[index];
        const chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
        const chunkId = inputItem.json.chunkId || inputItem.json.id || item.json.chunkId || `chunk_${index}`;
        const embedding = item.json.embedding; // Get embedding from current item (error item)
        
        if (chunk && embedding && Array.isArray(embedding)) {
          return {
            json: {
              ids: [chunkId],
              documents: [chunk],
              embeddings: [embedding]
            }
          };
        }
      }
    } catch (e) {
      // If that fails, throw error
      throw new Error(`Cannot recover chunk data. Original error: ${item.json.error}. Available fields: ${item.json.availableFields?.join(', ') || 'none'}`);
    }
    
    // If we get here, recovery failed
    throw new Error(`Cannot format item at index ${index}. Error: ${item.json.error}. Available fields: ${item.json.availableFields?.join(', ') || 'none'}`);
  }
  
  // Normal processing - chunk should be in item
  let chunk = item.json.chunk || item.json.text || item.json.content;
  let chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  let embedding = item.json.embedding;
  
  // If chunk still missing, try input
  if (!chunk) {
    try {
      const inputItems = $input.all();
      if (inputItems && inputItems.length > index) {
        const inputItem = inputItems[index];
        chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
        chunkId = inputItem.json.chunkId || inputItem.json.id || chunkId;
      }
    } catch (e) {
      // Ignore
    }
  }
  
  // Validate
  if (!chunk) {
    throw new Error(`Chunk is missing at index ${index}. Available fields: ${Object.keys(item.json).join(', ')}`);
  }
  
  if (!chunkId) {
    throw new Error(`chunkId is missing at index ${index}`);
  }
  
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error(`Embedding is missing or invalid at index ${index}`);
  }
  
  // Format for Chroma
  return {
    json: {
      ids: [chunkId],
      documents: [chunk],
      embeddings: [embedding]
    }
  };
});




