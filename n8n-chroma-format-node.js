// n8n Code Node - Format Data for Chroma
// Add this node BETWEEN merge and HTTP Request
// Name it: "Format for Chroma"

return items.map(item => {
  // Validate all required fields
  if (!item.json.chunk) {
    throw new Error(`Chunk is missing. Available fields: ${Object.keys(item.json).join(', ')}`);
  }
  
  if (!item.json.chunkId) {
    throw new Error('chunkId is missing');
  }
  
  if (!item.json.embedding || !Array.isArray(item.json.embedding)) {
    throw new Error('Embedding is missing or not an array');
  }
  
  // Format for Chroma API
  // Chroma expects: ids (array), documents (array), embeddings (array of arrays)
  return {
    json: {
      ids: [item.json.chunkId],
      documents: [item.json.chunk],
      embeddings: [item.json.embedding] // Wrap in array since we're sending one item
    }
  };
});




