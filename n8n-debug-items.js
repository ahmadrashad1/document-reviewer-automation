// DEBUG VERSION - Use this to see what data is available
// This will help you understand the structure of your items

return items.map((item, index) => {
  // Get input item to see what data is available
  let inputData = {};
  try {
    const inputItem = $input.item(index);
    inputData = {
      hasInput: true,
      inputFields: Object.keys(inputItem.json),
      inputSample: Object.keys(inputItem.json).reduce((acc, key) => {
        const value = inputItem.json[key];
        if (typeof value === 'string' && value.length > 50) {
          acc[key] = value.substring(0, 50) + '...';
        } else if (Array.isArray(value)) {
          acc[key] = `[Array with ${value.length} items]`;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {})
    };
  } catch (error) {
    inputData = {
      hasInput: false,
      error: error.message
    };
  }
  
  // Current item data
  const currentData = {
    fields: Object.keys(item.json),
    sample: Object.keys(item.json).reduce((acc, key) => {
      const value = item.json[key];
      if (typeof value === 'string' && value.length > 50) {
        acc[key] = value.substring(0, 50) + '...';
      } else if (Array.isArray(value)) {
        acc[key] = `[Array with ${value.length} items]`;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {})
  };
  
  return {
    json: {
      index: index,
      debug: {
        input: inputData,
        current: currentData,
        hasEmbedding: !!item.json.embedding,
        embeddingLength: item.json.embedding ? item.json.embedding.length : 0
      },
      // Also return the actual data so you can see it
      embedding: item.json.embedding,
      chunk: item.json.chunk || item.json.text || item.json.content,
      query: item.json.query,
      chunkId: item.json.chunkId || item.json.id
    }
  };
});




