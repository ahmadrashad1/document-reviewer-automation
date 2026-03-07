// COMPLETE SOLUTION - Use this in your "merge chunking + embedding" node
// This ensures chunk data is included and properly formatted

return items.map((item, index) => {
  // Get chunk from input items (the chunking node output)
  let chunk = null;
  let query = "";
  let chunkId = item.json.chunkId || `chunk_${index}`;
  
  // Get all input items to find the chunk data
  try {
    const inputItems = $input.all();
    
    if (inputItems && inputItems.length > index) {
      const inputItem = inputItems[index];
      chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
      query = inputItem.json.query || "";
      chunkId = inputItem.json.chunkId || inputItem.json.id || chunkId;
    }
  } catch (e) {
    // If that fails, try first input
    try {
      const firstInput = $input.first();
      query = firstInput.json.query || "";
    } catch (e2) {
      // Ignore
    }
  }
  
  // If still no chunk, check current item
  if (!chunk) {
    chunk = item.json.chunk || item.json.text || item.json.content;
  }
  
  // Validate
  if (!chunk) {
    return {
      json: {
        error: `Chunk data missing at index ${index}`,
        availableFields: Object.keys(item.json),
        chunkId: chunkId,
        query: query,
        embedding: item.json.embedding
      }
    };
  }
  
  if (!item.json.embedding || !Array.isArray(item.json.embedding)) {
    return {
      json: {
        error: `Embedding missing or invalid at index ${index}`,
        chunk: chunk,
        chunkId: chunkId,
        query: query
      }
    };
  }
  
  // Return complete merged data
  return {
    json: {
      chunk: chunk,        // ← Make sure this is included!
      query: query,
      chunkId: chunkId,
      embedding: item.json.embedding
    }
  };
});




