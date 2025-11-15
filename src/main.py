from backend.database.connection import DebateDatabase
from backend.database.insert import DataInserter
from backend.preprocessing.preprocess_script import preprocess
from backend.fact_checker_prototype.AI_FactChecker import EnhancedFactChecker
from backend.qa_pipeline.QA_pipeline import build_chroma_db
from backend.qa_pipeline.QA_pipeline import query_rag
from backend.retriever.retriever import run_retriever
from backend.core_llm.gpt5_nano import LLMClient
from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
from backend.embeddings_faiss.build_index import build_index
from pathlib import Path
from datetime import datetime
import time
import re

import logging
from openai import OpenAI
import os
from functools import wraps
# Flask
app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "user_file_uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

# Flask with CORS for React
cors = CORS(app, origins="*")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# Get debate name and date - used throughout pipeline
def get_debate_metadata():
    # Get debate name and date from user.
    source = input("\nEnter Debate name/source: ").strip()
    if not source:
        source = "Unknown Debate"
        print(f"No source provided, using: {source}")
    
    # Get date
    while True:
        date_input = input("Enter Debate date (YYYY-MM-DD, e.g., '2024-06-27'): ").strip()
        
        # If empty, use today's date
        if not date_input:
            date = datetime.now().strftime("%Y-%m-%d")
            print(f"No date provided, using today: {date}")
            break
        
        # Validate date format
        try:
            datetime.strptime(date_input, "%Y-%m-%d")
            date = date_input
            break
        except ValueError:
            print("Invalid format! Please use YYYY-MM-DD (e.g., 2024-06-27)")
    
    return source, date

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
            print("Goodbye!")
            exit()
        
        if not query:
            print("Please enter a valid query.")
            continue
        
        return query

# Extract core claim from QA response
def extract_core_claim(qa_response: str) -> str:
    """
    Extract a simple, fact-checkable claim from QA response.
    
    Removes:
    - QA meta-text ("Based on the provided context...")
    - Internal references (debate names, timestamps)
    - Citations and parenthetical information
    
    Returns:
    - Simple, declarative claim suitable for Wikipedia/News API search
    
    Examples:
        Input: "Based on the provided context, Donald Trump initially did not 
                support the abortion bill as he is reported to have called up 
                some folks in Congress to kill it (Debate: ABC News Presidential 
                Debate, Timestamp: 27:12:00)..."
        Output: "Donald Trump initially did not support the abortion bill"
    """
    text = qa_response.strip()
    
    # Remove common QA prefixes
    prefixes_to_remove = [
        "Based on the provided context, ",
        "According to the debate, ",
        "According to the passages, ",
        "According to the context, ",
        "Based on the information, ",
        "Based on the information provided, ",
        "From the context, ",
        "From the provided context, ",
        "The context indicates that ",
        "The passages indicate that ",
        "It can be inferred that ",
        "The debate transcript shows that ",
        "As mentioned in the debate, "
    ]
    
    for prefix in prefixes_to_remove:
        if text.lower().startswith(prefix.lower()):
            text = text[len(prefix):].strip()
            break
    
    # Remove citations in parentheses (Debate: ..., Timestamp: ...)
    text = re.sub(r'\(Debate:.*?\)', '', text)
    text = re.sub(r'\(Timestamp:.*?\)', '', text)
    text = re.sub(r'Timestamp: \d+:\d+:\d+', '', text)
    
    # Split into sentences and get the first one
    sentences = re.split(r'[.!?](?:\s+|$)', text)
    first_sentence = sentences[0].strip() if sentences else text
    
    # Remove "as he is reported to have..." type phrases
    reporting_phrases = [
        r'\s+as (?:he|she|they) (?:is|are|was|were) reported to have.*$',
        r'\s+as (?:he|she|they) (?:is|are|was|were) said to have.*$',
        r'\s+who (?:is|are|was|were) reported to.*$'
    ]
    
    for pattern in reporting_phrases:
        first_sentence = re.sub(pattern, '', first_sentence, flags=re.IGNORECASE)
    
    # Clean up extra whitespace
    first_sentence = ' '.join(first_sentence.split())
    
    # Limit to reasonable length (150 chars) for better API matching
    if len(first_sentence) > 150:
        # Try to cut at a word boundary
        first_sentence = first_sentence[:150].rsplit(' ', 1)[0].strip()
    
    return first_sentence

# Fact Checker
def run_fact_checker_loop(initial_claim=None, top_k=3, use_news=True):
    """
    Run fact checker in loop mode.
    
    Args:
        initial_claim: first claim to check from QA response
        top_k: Number of sources to check
        use_news: Whether to use NewsAPI
    """
    print("\n" + "="*80)
    print("FACT CHECKER")
    print("="*80)
    
    # Initialize EnhancedFactChecker
    fact_checker = EnhancedFactChecker(
        use_wikipedia=True,
        use_news_api=use_news,
        use_llm_verification=True,  # Enable LLM for maximum accuracy
        use_semantic_similarity=True  # Enable semantic analysis
    )
    
    # If initial claim provided, fact-check it first
    if initial_claim:
        # Extract simpler claim for better fact-checking
        core_claim = extract_core_claim(initial_claim)
        
        print(f"\nOriginal QA Response:")
        print(f"   {initial_claim[:200]}{'...' if len(initial_claim) > 200 else ''}")
        print(f"\nExtracted Claim for Fact-Checking:")
        print(f"   {core_claim}")
        print()
        
        try:
            result = fact_checker.check_claim(core_claim, top_k=top_k)
            print_enhanced_fact_check_result(result)
        except Exception as e:
            print(f"Error: {e}")
    
    # Loop for additional claims
    while True:
        claim = input("\nEnter claim to fact-check (or 'quit' to exit): ").strip()
        
        if claim.lower() in ['quit', 'exit', 'q']:
            print("Exiting fact checker!")
            break
        if not claim:
            print("Please enter a valid claim.")
            continue
        
        # Run fact check
        print(f"\nFact-checking: '{claim}'...")
        try:
            result = fact_checker.check_claim(claim, top_k=top_k)
            print_enhanced_fact_check_result(result)
        except Exception as e:
            print(f"Error: {e}")

def print_enhanced_fact_check_result(result):

    # Print results from EnhancedFactChecker (FactCheckResult dataclass)
    print("\n" + "="*80)
    print("FACT CHECK RESULTS")
    print("="*80)
    
    # Main verdict
    print(f"\nClaim: {result.claim}")
    print(f"Verdict: {result.verdict} {result.badge}")
    print(f"Confidence: {result.confidence:.1f}%")
    
    # Explanation
    if result.explanation:
        print(f"\nExplanation: {result.explanation}")
    
    # Evidence for/against
    if result.evidence_for:
        print("\nSupporting Evidence:")
        for evidence in result.evidence_for[:3]:
            print(f"- {evidence[:100]}...")
    
    if result.evidence_against:
        print("\nContradicting Evidence:")
        for evidence in result.evidence_against[:3]:
            print(f"- {evidence[:100]}...")
    
    # Per-source breakdown
    if result.per_source:
        print("\nPer-Source Evidence:")
        for entry in result.per_source[:5]:  # Show top 5
            print(f"\n[{entry['source']}] {entry.get('title', 'N/A')}")
            print(f"Judgment: {entry['label']} (score: {entry['score']:.2f})")
            print(f"Credibility: {entry.get('credibility', 0)*100:.0f}%")
            if entry.get("url"):
                print(f"URL: {entry['url']}")
            snippet_preview = (entry.get("snippet") or "")[:150]
            if snippet_preview:
                print(f"Snippet: {snippet_preview.replace(chr(10), ' ')}...")
    
    # Sources
    if result.sources:
        print(f"\nTotal Sources Used: {len(result.sources)}")
        print("\nTop Sources:")
        for i, source in enumerate(result.sources[:3], 1):
            print(f"{i}. {source['title']} ({source['source']})")
            print(f"Credibility: {source.get('credibility', 0)*100:.0f}%")
            print(f"URL: {source['url']}")
    
    print("\n" + "="*80)

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
'''
@app.route('/api/retrieve-response', methods=['POST'])
def retrieve_response():
    try:
        user_query = request.form.get('user_query', '').strip()
        print(f"User query: {user_query}")
        uploaded_file = request.files.get('file')
        print(f"Any file uploaded: {uploaded_file}")

        response_message = ""

        if uploaded_file:
            filename = uploaded_file.filename

            # Restrict file types
            if not filename.lower().endswith(".txt"):
                return jsonify({"error": "Only .txt files are allowed"}), 400

            # Create unique name to prevent overwriting
            safe_name = f"{int(time.time())}_{filename}"

            # Pathlib handles all OS differences internally
            file_path = UPLOAD_FOLDER / safe_name
            print(f"Uploading file '{filename}' at path '{file_path}'")
            uploaded_file.save(file_path)

            # Process file
            with file_path.open('r', encoding='utf-8') as f:
                contents = f.read()

            response_message += f"Received file '{filename}' ({len(contents)} characters)."

        if user_query:
            response_message += f" You asked: '{user_query}'"

        if not uploaded_file and not user_query:
            return jsonify({"error": "No file or query provided"}), 400

        final_reply = f"Processed successfully! {response_message}"
        return jsonify(final_reply)

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

def initiate_pipeline():
    #log.info("**********INITIATING ALL COMPONENTS**********")
    # Preprocessing
    debate_name, debate_date = get_debate_metadata()
    preprocess(debate_name, debate_date)

    # Database setup
    setup_database()

    # Embedding + FAISS
    build_index()

    # Get user query and number of results for retriever
    query = get_user_query()

    try:
        top_k_input = input("How many results? (default 3): ").strip()
        top_k = int(top_k_input) if top_k_input else 3
    except ValueError:
        top_k = 3
        print("Invalid number, using default: 3")

    # Retriever - pass query and top_k
    run_retriever(query, top_k)

    # QA
    build_chroma_db()
    response = query_rag(query)

    # Fact Checker
    run_fact_checker_loop(initial_claim=response, top_k=3, use_news=True)
    #log.info("**********ALL COMPONENTS EXECUTED**********")



@app.route("/query", methods=["POST"])
def query():
    data = request.get_json()
    user_query = data.get("query", "")
    system_prompt = data.get("system_prompt", "")
    conversation_history = data.get("conversation_history", [])[-5:]  # last 5 messages

    # Build messages for GPT-5
    messages = [{"role": "system", "content": system_prompt}]
    for m in conversation_history:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": user_query})

    # Call GPT-5 Nano
    response = client.responses.create(
        model="gpt-5-nano",
        input=messages,
        text={
            "format": {
                "type": "text"
            },
            "verbosity": "medium"
        },
        reasoning={
            "effort": "medium"
        },
        tools=[],
        store=True,
        include=[
            "reasoning.encrypted_content",
            "web_search_call.action.sources"
        ]
    )

    print(f"GPT-5 Nano usage metrics: {response.usage}")
    ai_reply = response.output_text
    if not ai_reply:
        ai_reply = "GPT-5 returned empty response."

    return jsonify({"response": ai_reply})

if __name__ == "__main__":
    # initiate_pipeline()
    app.run(debug=False, port=3000)