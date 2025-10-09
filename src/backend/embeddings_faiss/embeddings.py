import faiss
import numpy as np
import pickle
from sentence_transformers import SentenceTransformer

# STEP 1. Fetch utterances
def fetch_utterances():
    """
    Will be integrated with actual database later
    """
    return [
        {"debate_id": "debate_001", "speaker": "Biden", "text": "We need to invest in renewable energy to combat climate change. This will create jobs."},
        {"debate_id": "debate_001", "speaker": "Trump", "text": "We need to focus on economic growth by reducing regulations and taxes."},
        {"debate_id": "debate_002", "speaker": "Biden", "text": "Healthcare is a human right, and we should expand access for all citizens."},
        {"debate_id": "debate_001", "speaker": "Trump", "text": "Putting millions on Social Security and Medicare would destroy both programs."}
    ]


# STEP 2. Chunk text
def chunk_text(text, chunk_size=50):
    words = text.split()
    for i in range(0, len(words), chunk_size):
        yield " ".join(words[i:i + chunk_size])


# STEP 3. Generate embeddings (HuggingFace)
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def get_embedding(text):
    return model.encode(text)


# STEP 4. Build FAISS index
def build_index():
    utterances = fetch_utterances()

    vectors = []
    metadata = []

    for utt in utterances:
        for chunk in chunk_text(utt["text"]):
            emb = get_embedding(chunk)
            vectors.append(emb)
            metadata.append({
                "debate_id": utt["debate_id"],
                "speaker": utt["speaker"],
                "text": chunk
            })

    vectors_np = np.array(vectors).astype("float32")

    dimension = vectors_np.shape[1]
    index = faiss.IndexFlatIP(dimension)

    # Normalize vectors for cosine similarity
    faiss.normalize_L2(vectors_np)
    index.add(vectors_np)

    # Save FAISS index + metadata
    faiss.write_index(index, "debates.index")
    with open("metadata.pkl", "wb") as f:
        pickle.dump(metadata, f)

    print(f"✅ Index built with {len(metadata)} chunks.")


# STEP 5. Search function which returns top k results
def search(query, k=3):
    index = faiss.read_index("debates.index")
    with open("metadata.pkl", "rb") as f:
        metadata = pickle.load(f)

    q_emb = np.array([get_embedding(query)]).astype("float32")
    faiss.normalize_L2(q_emb)

    D, I = index.search(q_emb, k)

    print(f"\n🔎 Query: {query}")
    for score, idx in zip(D[0], I[0]):
        speaker = metadata[idx]['speaker']
        debate_id = metadata[idx]['debate_id']
        text = metadata[idx]['text']
        print(f" -> ({score:.3f}) {speaker} ({debate_id}): {text}")


#test
build_index()
search("What do you think about taxes?")

"""
if __name__ == "__main__":
    build_index()
    search("What do you think about climate change?")
"""