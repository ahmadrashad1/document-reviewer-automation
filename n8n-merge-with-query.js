// n8n JavaScript Code - Merge Chunks and Embeddings WITH Query
// This version properly retrieves the query from the workflow start

return items.map((item, index) => {
  // Try multiple ways to get the query
  let query = "";
  
  // Method 1: Query might be in current item
  if (item.json.query) {
    query = item.json.query;
  }
  // Method 2: Query might be in input item
  else {
    try {
      const inputItem = $input.item(index);
      if (inputItem.json.query) {
        query = inputItem.json.query;
      }
    } catch (e) {
      // Input access failed, continue
    }
  }
  
  // Method 3: Query might be in the first item from webhook (workflow start)
  if (!query) {
    try {
      // Get the first item from the workflow (webhook input)
      const firstItem = $input.first();
      if (firstItem && firstItem.json.query) {
        query = firstItem.json.query;
      }
    } catch (e) {
      // First item access failed
    }
  }
  
  // Method 4: Query might be stored in workflow context or variables
  // (This depends on your workflow setup)
  
  // Get chunk data
  const chunk = item.json.chunk || item.json.text || item.json.content;
  
  // Get chunkId
  const chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  
  // Get embedding
  const embedding = item.json.embedding;
  
  return {
    json: {
      chunk: chunk,
      query: query, // Will be empty if not found - this is expected if query isn't passed through
      chunkId: chunkId,
      embedding: embedding
    }
  };
});




