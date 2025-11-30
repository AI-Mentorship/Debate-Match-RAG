import os
import json
import numpy as np
import faiss
from datetime import datetime
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")
CHUNK_SIZE = int(os.getenv("EMBEDDING_CHUNK_SIZE"))
OUTPUT_INDEX = os.getenv("EMBEDDING_OUTPUT_INDEX")
OUTPUT_METADATA = os.getenv("EMBEDDING_OUTPUT_METADATA")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

class IncrementalFAISS:
    def __init__(self):
        self.mongo_client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
        self.db = self.mongo_client[DB_NAME]
        
    def chunk_text(self, text, chunk_size=CHUNK_SIZE):
        words = text.split()
        for i in range(0, len(words), chunk_size):
            yield " ".join(words[i:i + chunk_size])
    
    def embed_texts(self, texts):
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts
        )
        return [data.embedding for data in response.data]
    
    def get_last_update_timestamp(self):
        if not os.path.exists(OUTPUT_METADATA):
            return None
            
        try:
            with open(OUTPUT_METADATA, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            if metadata:
                # Get the most recent debate date from metadata
                dates = [m.get('debate_date') for m in metadata if m.get('debate_date')]
                if dates:
                    return max(dates)
            return None
        except:
            return None
    
    def get_new_utterances(self):
        """Get utterances that are not in the current index"""
        print("Fetching utterances from MongoDB...")
        
        # Get all debate IDs from the existing index
        existing_debate_ids = set()
        if os.path.exists(OUTPUT_METADATA):
            try:
                with open(OUTPUT_METADATA, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                existing_debate_ids = {m.get('debate_id') for m in metadata if m.get('debate_id')}
                print(f"Found {len(existing_debate_ids)} debates in existing index")
            except:
                existing_debate_ids = set()
        
        # Get all debates from database
        all_debates = list(self.db.debates.find({}))
        
        # Find debates that are not in the existing index
        new_debates = [d for d in all_debates if d["debate_id"] not in existing_debate_ids]
        
        if not new_debates:
            print("No new debates found")
            return []
        
        print(f"Found {len(new_debates)} new debates")
        
        # Get utterances for these debates
        debate_ids = [d["debate_id"] for d in new_debates]
        utterances = list(self.db.utterances.find({"debate_id": {"$in": debate_ids}}))
        
        # Get speaker and debate info
        speakers = {s["speaker_id"]: s for s in self.db.speakers.find({})}
        debates_dict = {d["debate_id"]: d for d in all_debates}
        
        joined = []
        for u in utterances:
            speaker = speakers.get(u["speaker_id"], {})
            debate = debates_dict.get(u["debate_id"], {})
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
        
        print(f"Found {len(joined)} new utterances from {len(new_debates)} new debates")
        return joined
    
    def load_existing_index(self):
        if os.path.exists(OUTPUT_INDEX) and os.path.exists(OUTPUT_METADATA):
            try:
                index = faiss.read_index(OUTPUT_INDEX)
                with open(OUTPUT_METADATA, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                print(f"Loaded existing index with {len(metadata)} chunks")
                return index, metadata
            except Exception as e:
                print(f"Error loading existing index: {e}")
        return None, []
    
    def update_index_incrementally(self):
        # Load existing index
        index, existing_metadata = self.load_existing_index()
        
        # Get new utterances
        new_utterances = self.get_new_utterances()
        
        if not new_utterances:
            print("Index is already up to date!")
            return 0
        
        # Process new utterances
        new_chunks = []
        new_metadata = []
        
        print("Chunking new utterances...")
        for u in new_utterances:
            for chunk in self.chunk_text(u["text"]):
                new_chunks.append(chunk)
                new_metadata.append({
                    "debate_id": u["debate_id"],
                    "debate_name": u["debate_name"],
                    "debate_date": u["debate_date"].strftime("%Y-%m-%d") if u.get("debate_date") else None,
                    "speaker": u["speaker_name"],
                    "role": u["speaker_role"],
                    "text": chunk,
                    "timestamp": u["timestamp"],
                    "topics": u.get("topics"),
                    "added_in_incremental": True  # Mark as incrementally added
                })
        
        print(f"Generated {len(new_chunks)} new chunks from {len(new_utterances)} utterances")
        
        # Generate embeddings for new chunks
        print("Generating embeddings for new chunks...")
        new_embeddings = []
        batch_size = 100
        
        for i in range(0, len(new_chunks), batch_size):
            batch = new_chunks[i:i + batch_size]
            emb = self.embed_texts(batch)
            new_embeddings.extend(emb)
            print(f"Embedded {i + len(batch)}/{len(new_chunks)} new chunks")
        
        # Convert to numpy
        new_embeddings_np = np.array(new_embeddings, dtype="float32")
        
        # Create or update index
        if index is None:
            print("Creating new FAISS index...")
            dimension = new_embeddings_np.shape[1]
            index = faiss.IndexFlatL2(dimension)
        else:
            print("Updating existing FAISS index...")
        
        # Add new embeddings to index
        index.add(new_embeddings_np)
        
        # Combine metadata
        combined_metadata = existing_metadata + new_metadata
        
        # Save updated index and metadata
        print(f"Saving updated FAISS index to {OUTPUT_INDEX}...")
        faiss.write_index(index, OUTPUT_INDEX)
        
        print(f"Saving updated metadata to {OUTPUT_METADATA}...")
        with open(OUTPUT_METADATA, "w", encoding="utf-8") as f:
            json.dump(combined_metadata, f, ensure_ascii=False, indent=2)
        
        print(f"Incremental update complete! Added {len(new_chunks)} new chunks")
        print(f"Total chunks in index: {len(combined_metadata)}")
        
        return len(new_chunks)
    
    def close(self):
        self.mongo_client.close()

def update_faiss_incrementally():
    incremental_faiss = IncrementalFAISS()
    try:
        new_count = incremental_faiss.update_index_incrementally()
        return new_count
    finally:
        incremental_faiss.close()