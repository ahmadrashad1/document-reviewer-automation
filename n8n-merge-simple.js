// SIMPLEST VERSION - Try this first
// This assumes chunk data is already in the items (passed through from previous node)

return items.map((item, index) => {
  return {
    json: {
      chunk: item.json.chunk || item.json.text || item.json.content,
      query: item.json.query || "",
      chunkId: item.json.chunkId || item.json.id || `chunk_${index}`,
      embedding: item.json.embedding
    }
  };
});




