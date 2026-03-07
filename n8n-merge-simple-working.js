// n8n Merge Code - SIMPLE WORKING VERSION
// Use this if chunk data is already in the items

return items.map((item, index) => {
  // Get data from current item
  const chunk = item.json.chunk || item.json.text || item.json.content;
  const query = item.json.query || "";
  const chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  const embedding = item.json.embedding;
  
  // If chunk is missing, try to get from input items
  if (!chunk) {
    const inputItems = $input.all();
    if (inputItems && inputItems.length > index) {
      const inputData = inputItems[index].json;
      return {
        json: {
          chunk: inputData.chunk || inputData.text || inputData.content,
          query: inputData.query || query,
          chunkId: inputData.chunkId || inputData.id || chunkId,
          embedding: embedding
        }
      };
    }
  }
  
  return {
    json: {
      chunk: chunk,
      query: query,
      chunkId: chunkId,
      embedding: embedding
    }
  };
});




