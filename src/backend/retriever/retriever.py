# This file will contain the retrieval functions :D
import pandas as pd 
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss


def run_retriever():

    df = pd.read_csv("debates.csv")
    
    # Generate embeddings
    model = SentenceTransformer('all-MiniLM-L6-v2')

    passages = df['Evidence Quote'].tolist()
    embeddings = model.encode(passages, convert_to_numpy=True)
    print("Generated embeddings shape:", embeddings.shape)
    
    # Build FAISS index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    print("FAISS index built with", index.ntotal, "passages")
    
    def retrieve(query, top_k=3):
        query_emb = model.encode([query], convert_to_numpy=True)
        distances, indices = index.search(query_emb, top_k) 
        results = []
        for i in indices[0]:
            row = df.iloc[i]
            results.append({
                'Speaker': row['Speaker/Candidate from Debate'],
                'Timestamp': row['Evidence Location'],
                'Text': row['Evidence Quote']
            }) 
        return results

    user_query = "What did Candidate A say about healthcare?"
    top_k = retrieve(user_query, top_k=3)

    print("\nTop-k results:")
    for r in top_k:
        print(r)