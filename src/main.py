from backend.database.connection import DebateDatabase
from backend.database.insert import DataInserter
from backend.preprocessing.preprocess_script import preprocess
from backend.fact_checker_prototype.fact_checker import claim_verdict
from backend.qa_pipeline.QA_pipeline import build_chroma_db
from backend.qa_pipeline.QA_pipeline import query_rag
from backend.retriever.retriever import run_retriever
from flask import Flask, jsonify # type: ignore
from flask_cors import CORS # type: ignore
from backend.embeddings_faiss.build_index import build_index

import json
import argparse

# Flask
app = Flask(__name__)

# Flask with CORS for React
cors = CORS(app, origins="*")

# Database
def setup_database():
    print("Setting up Debate AI Database...")
    
    # Initialize database connection
    database = DebateDatabase()
    
    if database.test_connection():
        print("\nLoading data from CSV file...")

        # Load CSV file
        inserter = DataInserter()
        inserter.process_transcript_file("debate_raw_transcript_clean.csv")

        print("\nDatabase setup complete!")
        print("Available collections:")
        collections = database.db.list_collection_names()
        for collection in collections:
            count = database.db[collection].count_documents({})
            print(f"  - {collection}: {count} documents")
    
    else:
        print("Database setup failed!")
    
    database.close_connection()

# User Query for Retriver and QA Pipeline
def get_user_query():
    # Get query input from user - shared by both retriever and QA.
    print("\n" + "="*80)
    print("QUERY INPUT")
    print("="*80)
    
    while True:
        query = input("\nEnter your query (or 'quit' to exit): ").strip()
        
        if query.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            exit()
        
        if not query:
            print("⚠️  Please enter a valid query.")
            continue
        
        return query

# Fact Checker Prototype
# Command-line interface for testing fact-checker.
def run_cli():
    parser = argparse.ArgumentParser(description = "Fact-checker for Debate Match")
    parser.add_argument("claim", type = str, help = "Claim to fact-check")
    parser.add_argument("--top", type = int, default = 3, help = "Top K results")
    parser.add_argument("--no-news", action="store_true", help = "Skip NewsAPI search.")
    parser.add_argument("--raw", action = "store_true", help = "Print raw JSON")
    args = parser.parse_args()
    
    result = claim_verdict(args.claim, top_k = args.top, use_news = (not args.no_news))
    
    if args.raw:
        print(json.dumps(result, indent = 2))
    else:
        print("Claim:", result["claim"])
        print("Verdict:", result["verdict"], f"(confidence {result['confidence']:.2f})")
        print("Badge:", result["badge_html"])
        print("\nPer-source evidence:")
        for entry in result["per_source"]:
            print(f"- [{entry['source']}] {entry.get('title')} -> {entry['label']} ({entry['score']:.2f})")
            if entry.get("url"):
                print("  URL:", entry["url"])
            snippet_preview = (entry.get("snippet") or "")[:200]
            if snippet_preview:
                print("  Snippet:", snippet_preview.replace("\n", " "))

# Front end
@app.route("/api/message", methods=["GET"])
def message():
    return jsonify(
        {
            "message": [
                "Hello",
                "World",
                "from Pavan",
                "main.py"
            ]
        }
    )

if __name__ == "__main__":
    # Preprocessing
    preprocess()

    # Database setup
    setup_database()

    # Embedding + FAISS
    build_index()
    
    # Get user query and number of results for retriever
    query = get_user_query()

    try:
        top_k_input = input("📊 How many results? (default 3): ").strip()
        top_k = int(top_k_input) if top_k_input else 3
    except ValueError:
        top_k = 3
        print("⚠️  Invalid number, using default: 3")

    # Retriever - pass query and top_k
    run_retriever(query, top_k)

    # QA 
    build_chroma_db()
    query_rag(query)

    # Pavan
    #run_cli()

    #app.run(debug=False, port=3000)