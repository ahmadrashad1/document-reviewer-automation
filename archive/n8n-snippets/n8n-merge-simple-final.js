// n8n Merge Code - Simple Version (if all data is already in items)
// Use this if chunk, query, chunkId, and embedding are all in item.json

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




