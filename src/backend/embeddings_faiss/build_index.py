import os
import json
from pymongo import MongoClient
import numpy as np
import faiss
from openai import OpenAI
from dotenv import load_dotenv
import certifi

# -----------------------------
# CONFIG
# -----------------------------
load_dotenv()  # Load .env file
MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")
CHUNK_SIZE = int(os.getenv("EMBEDDING_CHUNK_SIZE"))
OUTPUT_INDEX = os.getenv("EMBEDDING_OUTPUT_INDEX")
OUTPUT_METADATA = os.getenv("EMBEDDING_OUTPUT_METADATA")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("❌ Missing OPENAI_API_KEY in .env file")

client = OpenAI(api_key=OPENAI_API_KEY)

# -----------------------------
# MongoDB Connection
# -----------------------------
mongo_client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = mongo_client[DB_NAME]

# -----------------------------
# Helper Functions
# -----------------------------
def chunk_text(text, chunk_size=CHUNK_SIZE):
    """Split text into roughly equal-sized word chunks."""
    words = text.split()
    for i in range(0, len(words), chunk_size):
        yield " ".join(words[i:i + chunk_size])

def fetch_utterances():
    """Fetch utterances with speaker and debate info (join-like)."""
    print("Databases:", mongo_client.list_database_names())
    print("Collections in DB:", db.list_collection_names())
    utterances = list(db.utterances.find({}))
    speakers = {s["speaker_id"]: s for s in db.speakers.find({})}
    debates = {d["debate_id"]: d for d in db.debates.find({})}

    joined = []
    for u in utterances:
        speaker = speakers.get(u["speaker_id"], {})
        debate = debates.get(u["debate_id"], {})
        joined.append({
            "utterance_id": u["utterance_id"],
            "debate_id": u["debate_id"],
            "speaker_id": u["speaker_id"],
            "text": u["text"],
            "speaker_name": speaker.get("name", "Unknown"),
            "speaker_role": speaker.get("role", "Unknown"),
            "debate_name": debate.get("name", "Unknown"),
            "debate_date": debate.get("date"), 
            "timestamp": u.get("timestamp", None),
            "topics": u.get("topics")
        })
    return joined

def embed_texts(texts):
    """Generate embeddings from OpenAI embedding model."""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [data.embedding for data in response.data]

# -----------------------------
# Build FAISS Index
# -----------------------------
def build_index():
    print("Fetching utterances from MongoDB...")
    utterances = fetch_utterances()
    print(f"Fetched {len(utterances)} utterances")

    all_chunks = []
    metadata = []

    print("Chunking utterances...")
    for u in utterances:
        for chunk in chunk_text(u["text"]):
            all_chunks.append(chunk)
            metadata.append({
                "debate_id": u["debate_id"],
                "debate_name": u["debate_name"],
                "debate_date": u["debate_date"].strftime("%Y-%m-%d") if u.get("debate_date") else None,
                "speaker": u["speaker_name"],
                "role": u["speaker_role"],
                "text": chunk,
                "timestamp": u["timestamp"],
                "topics": u.get("topics")
            })

    print(f"Total chunks to embed: {len(all_chunks)}")

    print("Generating embeddings...")
    embeddings = []
    batch_size = 100  # adjust based on token limits

    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        emb = embed_texts(batch)
        embeddings.extend(emb)
        print(f"Embedded {i + len(batch)}/{len(all_chunks)}")

    embeddings_np = np.array(embeddings, dtype="float32")

    print("Building FAISS index...")
    dimension = embeddings_np.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings_np)

    print(f"Saving FAISS index to {OUTPUT_INDEX}...")
    faiss.write_index(index, OUTPUT_INDEX)

    print(f"Saving metadata to {OUTPUT_METADATA}...")
    with open(OUTPUT_METADATA, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print("✅ FAISS index build complete!")