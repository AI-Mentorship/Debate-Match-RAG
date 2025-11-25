# Import OpenAI embeddings and chat model
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from langchain_openai import OpenAIEmbeddings, ChatOpenAI

def get_embedding_function():
    return OpenAIEmbeddings(model="text-embedding-3-small")


import json
import os
from langchain_core.documents import Document
from langchain_chroma import Chroma
from datetime import datetime

CHROMA_PATH = "chroma"
embedding_function = get_embedding_function()

def build_chroma_db(force_rebuild=True):
    # Step 1: Load passages from JSON 
    print("="*80)
    print("DEBATE QA Pipeline")
    print("="*80)
    
    # Debug: Show current working directory and file locations
    import os
    from pathlib import Path
    cwd = Path.cwd()
    print(f"Current working directory: {cwd}")
    
    # Try multiple possible locations for passages.json
    possible_paths = [
        Path("passages.json"),
        cwd / "passages.json",
        cwd / "backend" / "retriever" / "passages.json",
        cwd / "backend" / "qa_pipeline" / "passages.json",
        cwd / "src" / "passages.json",
        cwd.parent / "passages.json",
    ]
    
    passages_file = None
    for path in possible_paths:
        if path.exists():
            passages_file = path
            print(f"✓ Found passages.json at: {passages_file.absolute()}")
            break
    
    if not passages_file:
        print(f"passages.json NOT found in any expected location")
        print(f"Searched locations:")
        for path in possible_paths:
            print(f"  - {path.absolute()}")
        raise FileNotFoundError(f"passages.json not found. Make sure retriever ran successfully.")
    
    print(f"Loading passages from {passages_file}...")
    with open(passages_file, "r") as f:
        passages = json.load(f)
    
    print(f"Found {len(passages)} passages")

    # Step 2: Convert each JSON entry into a Document 
    new_documents = [
        Document(
            page_content=p["text"],
            metadata={
                "debate_name": p.get("debate_name", "Unknown"),
                "speaker": p.get("speaker", "Unknown"),
                "timestamp": p.get("timestamp"),
                "topics": ','.join(p.get("topics", [])) if isinstance(p.get("topics"), list) else p.get("topics", "")
            }
        )
        for p in passages
    ]

    # Step 3: Create fresh Chroma database with unique collection name
    if force_rebuild or not os.path.exists(CHROMA_PATH):
        print("Creating fresh ChromaDB with OpenAI embeddings...")
        # Use a timestamped collection name to ensure it's completely fresh
        collection_name = f"debate_passages_{int(datetime.now().timestamp())}"
        # Create completely fresh database with unique collection
        db = Chroma.from_documents(
            new_documents, 
            embedding_function, 
            persist_directory=CHROMA_PATH,
            collection_name=collection_name
        )
        print(f"Created fresh ChromaDB with {len(new_documents)} passages")
        print(f"Collection name: {collection_name}")
    else:
        # Load existing and add only new documents
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
        existing = db.get()
        existing_texts = set(existing["documents"]) if existing["documents"] else set()
        
        # Filter out duplicates 
        unique_documents = [doc for doc in new_documents if doc.page_content not in existing_texts]
        
        # Add only unique documents 
        if unique_documents:
            db.add_documents(unique_documents)
            print(f"Added {len(unique_documents)} new unique passages to Chroma DB.")
        else:
            print(f"No new passages to add (all {len(new_documents)} already exist)")
    
    return db

from langchain_core.prompts import ChatPromptTemplate
from langchain_chroma import Chroma


## Template for the prompt:
PROMPT_TEMPLATE = """
Answer the question based only on the given context.

When you reference any information from the context, you must cite it using this exact format:
(Debate: [debate name], Timestamp: [timestamp])

For example: "Person Y stated X (Debate: "cite debate here", Timestamp: "cite timestamp here")"

{context}

---

Answer the question based on the above context only: {question}
"""

def query_rag(query_text):
    print(f"\n🔎 Querying RAG system with: '{query_text}'...")
    
    client = None
    try:
        # Reload the Chroma vector database from disk
        # Get the latest collection (most recent timestamp)
        import chromadb
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        collections = client.list_collections()
        
        if not collections:
            raise ValueError("No collections found in ChromaDB!")
        
        # Get the newest collection (highest timestamp in name)
        latest_collection = max(collections, key=lambda c: c.name)
        print(f"Using collection: {latest_collection.name}")
        
        db = Chroma(
            client=client,
            embedding_function=embedding_function,
            collection_name=latest_collection.name
        )

        # Retrieves similar passages to the query
        results = db.similarity_search_with_score(query_text, k=40)

        # Build context text
        context_text = "\n\n---\n\n".join([
            f"{doc.page_content} (Debate: {doc.metadata.get('debate_name')}, Timestamp: {doc.metadata.get('timestamp')})"
            for doc, _ in results
        ])

        # Format the prompt using the context and user question
        prompt_str = ChatPromptTemplate.from_template(PROMPT_TEMPLATE).format_messages(
            context=context_text, question=query_text
        )

        # Initialize the OpenAI model (using GPT-3.5-turbo)
        print("Generating response from OpenAI (gpt-3.5-turbo)...")
        model = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        # Generate the response from the model
        response = model.invoke(prompt_str)

        return response.content
    
    finally:
        # Always close the client connection
        if client is not None:
            try:
                # ChromaDB doesn't have an explicit close, but we can delete the reference
                del client
            except:
                pass