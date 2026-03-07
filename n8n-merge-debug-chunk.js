// DEBUG VERSION - Use this to see what data is available
// This will help identify where the chunk data is

return items.map((item, index) => {
  // Debug: Check what's in current item
  const currentFields = Object.keys(item.json);
  
  // Debug: Check what's in input items
  let inputDebug = { error: "Could not access input" };
  let inputFields = [];
  let chunkFromInput = null;
  
  try {
    const inputItems = $input.all();
    inputDebug = {
      count: inputItems ? inputItems.length : 0,
      hasItemAtIndex: inputItems && inputItems.length > index
    };
    
    if (inputItems && inputItems.length > index) {
      inputFields = Object.keys(inputItems[index].json);
      chunkFromInput = inputItems[index].json.chunk || 
                      inputItems[index].json.text || 
                      inputItems[index].json.content;
    }
  } catch (e) {
    inputDebug.error = e.message;
  }
  
  // Try to get chunk from current item
  const chunkFromCurrent = item.json.chunk || item.json.text || item.json.content;
  
  // Return debug info + actual data
  return {
    json: {
      _debug: {
        index: index,
        currentItemFields: currentFields,
        inputDebug: inputDebug,
        inputItemFields: inputFields,
        chunkFromCurrent: chunkFromCurrent ? "Found" : "Not found",
        chunkFromInput: chunkFromInput ? "Found" : "Not found"
      },
      // Also return the actual data we have
      embedding: item.json.embedding,
      chunk: chunkFromCurrent || chunkFromInput,
      chunkId: item.json.chunkId || `chunk_${index}`,
      query: item.json.query || ""
    }
  };
});




