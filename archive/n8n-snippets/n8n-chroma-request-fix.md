# Fix: Chroma HTTP Request JSON Error

## Problem

The error "JSON parameter needs to be valid JSON" is caused by incorrect expression syntax in the HTTP Request body.

## Issues Found

1. **Embeddings field:** `[={{$json.embedding}}]` is wrong - creates nested array
2. **Documents field:** Expression might not be evaluating correctly
3. **Expression syntax:** The `=` placement is incorrect

## Correct JSON Configuration

In your HTTP Request node for Chroma, use this JSON body:

```json
{
  "ids": ["={{$json.chunkId}}"],
  "documents": ["={{$json.chunk}}"],
  "embeddings": [={{$json.embedding}}]
}
```

**OR** if the above doesn't work, try without the outer brackets for embeddings:

```json
{
  "ids": ["={{$json.chunkId}}"],
  "documents": ["={{$json.chunk}}"],
  "embeddings": {{$json.embedding}}
}
```

## Step-by-Step Fix

1. **Open your HTTP Request node** ("HTTP Request - store in chroma")

2. **In the JSON Configuration area**, replace the body with:

```json
{
  "ids": ["={{$json.chunkId}}"],
  "documents": ["={{$json.chunk}}"],
  "embeddings": [={{$json.embedding}}]
}
```

3. **Important Notes:**
   - `ids` and `documents` are arrays, so they need `["..."]`
   - `embeddings` should be an array of arrays: `[[...], [...]]`
   - Since `$json.embedding` is already an array, wrapping it in `[]` creates the correct format

4. **If you get errors**, try this alternative format:

```json
{
  "ids": ["={{$json.chunkId}}"],
  "documents": ["={{$json.chunk}}"],
  "embeddings": [={{JSON.stringify($json.embedding)}}]
}
```

## Alternative: Use Code Node to Format

If the expressions don't work, add a Code node before the HTTP Request to format the data:

```javascript
return items.map(item => ({
  json: {
    ids: [item.json.chunkId],
    documents: [item.json.chunk],
    embeddings: [item.json.embedding]
  }
}));
```

Then in the HTTP Request node, use:
```json
={{$json}}
```

## Chroma API Format

Chroma expects:
- `ids`: Array of strings `["id1", "id2"]`
- `documents`: Array of strings `["text1", "text2"]`
- `embeddings`: Array of arrays `[[0.1, 0.2, ...], [0.3, 0.4, ...]]`

Since you're processing one item at a time, each request should have:
- `ids`: `["chunk_0"]` (single item array)
- `documents`: `["chunk text"]` (single item array)
- `embeddings`: `[[0.924, 0.685, ...]]` (array containing one embedding array)




