from backend.database.connection import DebateDatabase
from backend.database.insert import DataInserter
from backend.preprocessing.preprocess_script import main
from backend.fact_checker_prototype.fact_checker import claim_verdict
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
        inserter.process_transcript_file("backend/data/sample_data.csv")

        print("\nDatabase setup complete!")
        print("Available collections:")
        collections = database.db.list_collection_names()
        for collection in collections:
            count = database.db[collection].count_documents({})
            print(f"  - {collection}: {count} documents")
    
    else:
        print("Database setup failed!")
    
    database.close_connection()

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
    main()

    # Database setip
    setup_database()

    # Embedding + FAISS
    build_index()
    app.run(debug=False, port=3000)

    # Retriever
    run_retriever()

    # QA
    user_question = input(" Enter your question: ")
    query_rag(user_question)

    # Pavan
    run_cli()