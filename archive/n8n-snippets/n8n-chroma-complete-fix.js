// n8n Code Node - Complete Fix for Chroma Storage
// Use this BEFORE your HTTP Request node to Chroma
// This ensures all data is properly formatted and chunk is included

return items.map(item => {
  // Validate and get chunk data
  const chunk = item.json.chunk || item.json.text || item.json.content;
  
  if (!chunk) {
    throw new Error(`Chunk data is missing at index ${item.index}. Available fields: ${Object.keys(item.json).join(', ')}`);
  }
  
  // Validate chunkId
  const chunkId = item.json.chunkId || item.json.id || `chunk_${item.index}`;
  
  // Validate embedding
  if (!item.json.embedding || !Array.isArray(item.json.embedding)) {
    throw new Error(`Embedding is missing or not an array at index ${item.index}`);
  }
  
  // Format for Chroma API
  // Chroma expects:
  // - ids: array of strings
  // - documents: array of strings  
  // - embeddings: array of arrays (each embedding is an array of numbers)
  return {
    json: {
      ids: [chunkId],
      documents: [chunk],
      embeddings: [item.json.embedding] // Wrap in array since we're sending one item at a time
    }
  };
});




