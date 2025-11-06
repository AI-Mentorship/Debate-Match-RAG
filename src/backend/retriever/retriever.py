# This file contains retrieval functions using FAISS index
import json
import numpy as np
import faiss
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

# Paths from .env
INDEX_PATH = os.getenv("EMBEDDING_OUTPUT_INDEX", "debates.index")
METADATA_PATH = os.getenv("EMBEDDING_OUTPUT_METADATA", "debate_metadata.json")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("Missing OPENAI_API_KEY in .env file")

class DebateRetriever:
    def __init__(self):
        # Initialize retriever by loading FAISS index and metadata.
        print(f"- Loading FAISS index from {INDEX_PATH}...")
        self.index = faiss.read_index(INDEX_PATH)
        print(f"FAISS index loaded with {self.index.ntotal} passages")
        
        print(f"- Loading metadata from {METADATA_PATH}...")
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
        print(f"Metadata loaded with {len(self.metadata)} entries")
        
        # Load OpenAI client (same embedding model used to build index)
        print("- Loading OpenAI client...")
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        print("OpenAI client loaded")
    
    def retrieve(self, query, debate_name, top_k=3):
        """
        Retrieve top-k most relevant passages for a query from a specific debate.

        Args:
            query: String query to search for
            debate_name: Name of the debate to filter by
            top_k: Number of results to return

        Returns:
            List of dicts with speaker, timestamp, text, debate_name, and topics
        """
        # Generate query embedding using OpenAI
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=[query]
        )
        query_emb = np.array([response.data[0].embedding], dtype='float32')

        # Search FAISS index - get more results to filter by debate
        # We search for more (k * 10) to ensure we have enough after filtering
        search_k = min(top_k * 10, self.index.ntotal)
        distances, indices = self.index.search(query_emb, search_k)

        # Filter results by debate_name and format
        results = []
        for idx in indices[0]:
            meta = self.metadata[idx]
            
            # Only include passages from the specified debate
            if meta.get('debate_name') == debate_name:
                results.append({
                    'debate name': meta['debate_name'],
                    'speaker': meta['speaker'],
                    'timestamp': meta['timestamp'],
                    'text': meta['text'],
                    'topics': meta.get('topics', [])
                })
                
                # Stop when we have enough results
                if len(results) >= top_k:
                    break
        
        if len(results) < top_k:
            print(f"⚠️  Warning: Only found {len(results)} passages for debate '{debate_name}'")
        
        return results

    
    def save_results(self, results, filename="passages.json"):
        """Save retrieval results to a JSON file."""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=4, ensure_ascii=False)
        print(f"\n✅ Results saved to '{filename}' ({len(results)} passages)\n")


def run_retriever(query, debate_name, top_k):
    """
    Run retriever with query parameter and debate filter.
    
    Args:
        query: Query string to search for
        debate_name: Name of the debate to retrieve passages from
        top_k: Number of results to return
    
    Returns:
        Tuple of (query, results)
    """
    print("\n" + "="*80)
    print("DEBATE RETRIEVER")
    print("="*80)
    
    # Initialize retriever
    retriever = DebateRetriever()
    
    # Retrieve results filtered by debate_name
    print(f"\n🔎 Searching for: '{query}'")
    results = retriever.retrieve(query, debate_name, top_k=top_k)
        
    # Save results to passages.json
    retriever.save_results(results)