from backend.database.connection import DebateDatabase
from backend.database.insert import DataInserter
from backend.preprocessing.preprocess_script import preprocess
from backend.fact_checker_prototype.fact_checker import claim_verdict
from backend.qa_pipeline.QA_pipeline import build_chroma_db
from backend.qa_pipeline.QA_pipeline import query_rag
from backend.retriever.retriever import run_retriever
from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
from backend.embeddings_faiss.build_index import build_index
import logging as log

import json
import argparse

# Flask
app = Flask(__name__)

# Flask with CORS for React
cors = CORS(app, origins="*")

# Get debate name once - used throughout pipeline
def get_debate_name():
    source = input("\nEnter Debate name/source: ").strip()
    if not source:
        source = "Unknown Debate"
        print(f"No source provided, using: {source}")
    
    return source

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
def run_cli(top_k=3, use_news=True):
    print("\n" + "="*80)
    print("Fact Checking")
    print("="*80)


    claim = input("\nEnter the claim to fact-check based on the response (or 'quit' to exit): ").strip()
        
    if claim.lower() in ['quit', 'exit', 'q']:
        print("👋 Goodbye!")        
    if not claim:
        print("⚠️  Please enter a valid claim.")
        
    # Run fact check with provided args
    print(f"🔍 Fact-checking: '{claim}'")
    try:
        result = claim_verdict(claim, top_k, use_news)
        
        print(f"\nClaim: {result['claim']}")
        print(f"Verdict: {result['verdict']} (confidence {result['confidence']:.2f})")
        print("\nPer-source evidence:")
        for entry in result["per_source"]:
            print(f"- [{entry['source']}] {entry.get('title')} -> {entry['label']} ({entry['score']:.2f})")
            if entry.get("url"):
                print("  URL:", entry["url"])
            snippet_preview = (entry.get("snippet") or "")[:200]
            if snippet_preview:
                print("  Snippet:", snippet_preview.replace("\n", " "))
    except Exception as e:
        print(f"❌ Error: {e}")
'''
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

@app.route('/api/retrieve-response', methods=['POST'])
def retrieve_response():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400

    user_query = data.get('user_query')
    if user_query is None:
        return jsonify({'error': 'Missing user query in request body'}), 400

    # TO BE IMPLEMENTED
    # response = run_retriever(user_query)

    response = "Test Response returned by the API"
    return jsonify(response), 200
'''
def initiate_pipline():
    #log.info("**********INITIATING ALL COMPONENTS**********")
    # Preprocessing
    debate_name = get_debate_name()
    preprocess(debate_name)

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
    response = query_rag(query)
    print(response)

    # Fact Checker
    #run_cli()
    #log.info("**********ALL COMPONENTS EXECUTED**********")

if __name__ == "__main__":
    initiate_pipline()
    #app.run(debug=False, port=3000)