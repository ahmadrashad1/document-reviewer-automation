// n8n Code Node - Format Data for Chroma API
// Use this BEFORE your HTTP Request node to Chroma
// This ensures the data is properly formatted

return items.map(item => {
  // Validate required fields
  if (!item.json.chunkId) {
    throw new Error('chunkId is missing');
  }
  if (!item.json.chunk) {
    throw new Error('chunk text is missing');
  }
  if (!item.json.embedding || !Array.isArray(item.json.embedding)) {
    throw new Error('embedding is missing or not an array');
  }
  
  // Format for Chroma API
  return {
    json: {
      ids: [item.json.chunkId],
      documents: [item.json.chunk],
      embeddings: [item.json.embedding] // Wrap in array since Chroma expects array of arrays
    }
  };
});




