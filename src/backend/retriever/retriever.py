# This file contains retrieval functions using FAISS index
import json
import numpy as np
import faiss
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

# Paths from .env
INDEX_PATH = os.getenv("EMBEDDING_OUTPUT_INDEX", "debate_index.faiss")
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
    
    def retrieve(self, query, top_k=3):
        """
        Retrieve top-k most relevant passages for a query.
        
        Args:
            query: String query to search for
            top_k: Number of results to return
            
        Returns:
            List of dicts with speaker, debate, text, timestamp, and score
        """
        # Generate query embedding using OpenAI (same as build_index.py)
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=[query]
        )
        query_emb = np.array([response.data[0].embedding], dtype='float32')
        
        # Search FAISS index
        distances, indices = self.index.search(query_emb, top_k)
        
        # Format results
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            meta = self.metadata[idx]
            results.append({
                'speaker': meta['speaker'],
                'role': meta['role'],
                'debate': meta['debate_name'],
                'timestamp': meta['timestamp'],
                'text': meta['text'],
                'score': float(distance)  # L2 distance (lower is better)
            })
        
        return results
    
    def format_results(self, results):
        """Pretty print retrieval results."""
        print("\n" + "="*80)
        print(f"Found {len(results)} relevant passages:")
        print("="*80)
        
        for i, r in enumerate(results, 1):
            print(f"\n[{i}] {r['speaker']} ({r['role']}) - {r['debate']}")
            print(f"    Timestamp: {r['timestamp']}")
            print(f"    Score: {r['score']:.4f}")
            print(f"    Text: {r['text'][:200]}..." if len(r['text']) > 200 else f"    Text: {r['text']}")


def run_retriever():
    """Interactive retrieval demo."""
    print("\n" + "="*80)
    print("DEBATE RETRIEVER")
    print("="*80)
    
    # Initialize retriever
    retriever = DebateRetriever()
    
    # Interactive loop
    while True:
        print("\n" + "-"*80)
        query = input("\nEnter your query (or 'quit' to exit): ").strip()
        
        if query.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            break
        
        if not query:
            print("⚠️  Please enter a query")
            continue
        
        # Get number of results
        try:
            top_k_input = input("📊 How many results? (default 3): ").strip()
            top_k = int(top_k_input) if top_k_input else 3
        except ValueError:
            top_k = 3
            print("⚠️  Invalid number, using default: 3")
        
        # Retrieve results
        print(f"\n🔎 Searching for: '{query}'...")
        results = retriever.retrieve(query, top_k=top_k)
        
        # Display results
        retriever.format_results(results)

if __name__ == "__main__":
    # Run interactive mode by default
    run_retriever()