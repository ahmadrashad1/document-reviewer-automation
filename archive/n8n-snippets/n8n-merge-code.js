// n8n JavaScript Code for Merging Chunks and Embeddings
// Copy this code into your n8n Code/JavaScript node

// ============================================
// OPTION 1: If chunk data is in the input items
// (Most common scenario - embeddings node receives chunks as input)
// ============================================
return items.map((item) => {
  return {
    json: {
      chunk: item.json.chunk || item.json.text,
      query: item.json.query,
      chunkId: item.json.chunkId || item.json.id || `chunk_${item.index}`,
      embedding: item.json.embedding
    }
  };
});

// ============================================
// OPTION 2: If you need to reference another node
// (Make sure node name matches exactly - case sensitive!)
// ============================================
/*
const CHUNK_NODE_NAME = "Chunk Document"; // Update this to your exact node name

return items.map((item, index) => {
  try {
    const chunkItems = $items(CHUNK_NODE_NAME, 0);
    
    if (!chunkItems || chunkItems.length === 0) {
      throw new Error(`No items found in node "${CHUNK_NODE_NAME}"`);
    }
    
    if (index >= chunkItems.length) {
      throw new Error(`Index ${index} out of bounds. Node has ${chunkItems.length} items.`);
    }
    
    const chunkData = chunkItems[index].json;
    
    return {
      json: {
        chunk: chunkData.chunk || chunkData.text,
        query: chunkData.query,
        chunkId: chunkData.chunkId || chunkData.id || `chunk_${index}`,
        embedding: item.json.embedding
      }
    };
  } catch (error) {
    // Return error info for debugging
    return {
      json: {
        error: error.message,
        index: index,
        embedding: item.json.embedding,
        availableNodes: "Check node name matches exactly"
      }
    };
  }
});
*/

// ============================================
// OPTION 3: Using $input.item() (if items are paired)
// ============================================
/*
return items.map((item, index) => {
  const inputItem = $input.item(index);
  
  return {
    json: {
      chunk: inputItem.json.chunk || inputItem.json.text,
      query: inputItem.json.query,
      chunkId: inputItem.json.chunkId || inputItem.json.id || `chunk_${index}`,
      embedding: item.json.embedding
    }
  };
});
*/

// ============================================
// OPTION 4: With error handling and validation
// ============================================
/*
return items.map((item, index) => {
  // Validate embedding exists
  if (!item.json.embedding) {
    return {
      json: {
        error: `No embedding found at index ${index}`,
        index: index
      }
    };
  }
  
  // Try to get chunk data from current item first
  const chunk = item.json.chunk || item.json.text;
  const query = item.json.query;
  const chunkId = item.json.chunkId || item.json.id || `chunk_${index}`;
  
  if (!chunk) {
    // If not in current item, try to get from input
    try {
      const inputItem = $input.item(index);
      return {
        json: {
          chunk: inputItem.json.chunk || inputItem.json.text,
          query: inputItem.json.query || query,
          chunkId: inputItem.json.chunkId || chunkId,
          embedding: item.json.embedding
        }
      };
    } catch (error) {
      return {
        json: {
          error: `Could not find chunk data at index ${index}: ${error.message}`,
          embedding: item.json.embedding
        }
      };
    }
  }
  
  return {
    json: {
      chunk: chunk,
      query: query,
      chunkId: chunkId,
      embedding: item.json.embedding
    }
  };
});
*/




