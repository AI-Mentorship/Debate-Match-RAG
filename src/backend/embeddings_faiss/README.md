# Debate Utterances Embedding Pipeline

A Python pipeline that fetches debate utterances from MongoDB, chunks the text, generates embeddings using OpenAI's API, and builds a FAISS index for efficient semantic search.

## Overview

This tool processes debate transcripts stored in MongoDB by:
1. Fetching utterances along with speaker and debate metadata
2. Chunking long texts into manageable segments
3. Generating embeddings using OpenAI's `text-embedding-3-small` model
4. Building a FAISS index for fast similarity search
5. Saving metadata for each embedded chunk

## Prerequisites

- Python 3.7+
- MongoDB instance with debate data
- OpenAI API key

## Installation

Install required dependencies:

```bash
pip install pymongo numpy faiss-cpu openai python-dotenv
```

For GPU support, use `faiss-gpu` instead of `faiss-cpu`.

## Configuration

Create a `.env` file in the project root with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/
DB_NAME=debates_db
EMBEDDING_CHUNK_SIZE=500
EMBEDDING_OUTPUT_INDEX=faiss_index.bin
EMBEDDING_OUTPUT_METADATA=metadata.json
OPENAI_API_KEY=your_openai_api_key_here
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/` |
| `DB_NAME` | Database name | `debates_db` |
| `EMBEDDING_CHUNK_SIZE` | Words per chunk | `500` |
| `EMBEDDING_OUTPUT_INDEX` | FAISS index output path | `faiss_index.bin` |
| `EMBEDDING_OUTPUT_METADATA` | Metadata JSON output path | `metadata.json` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

## MongoDB Schema

The pipeline expects three collections in your MongoDB database:

### `utterances`
```json
{
  "utterance_id": "string",
  "debate_id": "string",
  "speaker_id": "string",
  "text": "string",
  "timestamp": "optional"
}
```

### `speakers`
```json
{
  "speaker_id": "string",
  "name": "string",
  "role": "string"
}
```

### `debates`
```json
{
  "debate_id": "string",
  "name": "string"
}
```

## Usage

Run the pipeline:

```bash
python build_embeddings.py
```

The script will:
1. Connect to MongoDB and fetch all utterances
2. Join with speaker and debate information
3. Chunk each utterance into segments
4. Generate embeddings in batches of 100
5. Save the FAISS index and metadata files

## Output Files

### `faiss_index.bin`
Binary FAISS index containing all embeddings. Use this for similarity search.

### `metadata.json`
JSON array containing metadata for each chunk:
```json
[
  {
    "debate_id": "debate_001",
    "debate_name": "Presidential Debate 2024",
    "speaker": "John Doe",
    "role": "Moderator",
    "text": "chunk text here...",
    "timestamp": "optional"
  }
]
```

## Key Functions

### `chunk_text(text, chunk_size)`
Splits text into word-based chunks of approximately `chunk_size` words.

### `fetch_utterances()`
Retrieves utterances from MongoDB and joins with speaker and debate metadata.

### `embed_texts(texts)`
Generates embeddings using OpenAI's `text-embedding-3-small` model.

### `build_index()`
Main function that orchestrates the entire pipeline.

## Performance Considerations

- **Batch Size**: Embeddings are generated in batches of 100 to stay within API rate limits
- **Chunk Size**: Default is 500 words per chunk; adjust based on your needs
- **Index Type**: Uses `IndexFlatL2` for exact search; consider `IndexIVFFlat` for larger datasets

## Error Handling

The script will raise an error if:
- `OPENAI_API_KEY` is missing from the `.env` file
- MongoDB connection fails
- Required collections don't exist

## Cost Estimation

OpenAI's `text-embedding-3-small` model pricing:
- $0.02 per 1M tokens
- Estimate ~0.75 tokens per word
- For 10,000 utterances with 100 words each: ~$0.15

## Future Enhancements

- Add progress bars for better visibility
- Implement incremental indexing for new utterances
- Add support for multiple embedding models
- Include similarity search query examples
- Add error recovery for failed API calls

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]