// n8n JavaScript Code - FIXED VERSION
// Use this code in your Code/JavaScript node to merge chunks and embeddings

// ============================================
// SOLUTION: Access data from input items
// This works when chunk data comes from the previous node
// ============================================

return items.map((item, index) => {
  try {
    // Get the input item that corresponds to this embedding
    // This is the item from the previous node (before embeddings)
    const inputItem = $input.item(index);
    
    // Extract chunk data from input item
    const chunk = inputItem.json.chunk || inputItem.json.text || inputItem.json.content;
    const query = inputItem.json.query;
    const chunkId = inputItem.json.chunkId || inputItem.json.id || `chunk_${index}`;
    
    // Get embedding from current item (from Ollama response)
    const embedding = item.json.embedding;
    
    // Validate required fields
    if (!embedding) {
      return {
        json: {
          error: `No embedding found at index ${index}`,
          index: index,
          chunk: chunk,
          query: query,
          chunkId: chunkId
        }
      };
    }
    
    if (!chunk) {
      return {
        json: {
          error: `No chunk data found at index ${index}`,
          index: index,
          availableFields: Object.keys(inputItem.json),
          embedding: embedding
        }
      };
    }
    
    // Return merged data
    return {
      json: {
        chunk: chunk,
        query: query || "",
        chunkId: chunkId,
        embedding: embedding
      }
    };
    
  } catch (error) {
    // If $input.item() doesn't work, try accessing data from current item
    // Sometimes the chunk data is preserved through the HTTP request
    const chunk = item.json.chunk || item.json.text || item.json.content;
    const query = item.json.query || "";
    const chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
    const embedding = item.json.embedding;
    
    if (chunk && embedding) {
      return {
        json: {
          chunk: chunk,
          query: query,
          chunkId: chunkId,
          embedding: embedding
        }
      };
    }
    
    // Last resort: return error with debugging info
    return {
      json: {
        error: `Error at index ${index}: ${error.message}`,
        index: index,
        embedding: embedding,
        availableFields: Object.keys(item.json),
        note: "Check if chunk data is in input items or current items"
      }
    };
  }
});




