// n8n Merge Code - Final Version
// Use this in your "merge chunking + embedding" node
// Assumes chunk data is already in items (from Code node before embeddings)

return items.map((item, index) => {
  // Get all data from current item
  const chunk = item.json.chunk || item.json.text || item.json.content;
  const query = item.json.query || "";
  const chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  const embedding = item.json.embedding;
  
  // Validate required fields
  if (!chunk) {
    return {
      json: {
        error: `Chunk missing at index ${index}`,
        availableFields: Object.keys(item.json),
        chunkId: chunkId,
        query: query,
        embedding: embedding
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
  
  // Return merged data
  return {
    json: {
      chunk: chunk,
      query: query,
      chunkId: chunkId,
      embedding: embedding
    }
  };
});




