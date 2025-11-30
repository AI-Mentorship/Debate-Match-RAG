from backend.preprocessing.preprocess_script import preprocess
from backend.database.connection import DebateDatabase
from backend.database.insert import DataInserter
from backend.embeddings_faiss.build_index import build_index
from backend.retriever.retriever import run_retriever
from backend.qa_pipeline.QA_pipeline import query_rag, build_chroma_db
from backend.fact_checker_prototype.AI_FactChecker import EnhancedFactChecker
from backend.core_llm.gpt5_nano import LLMClient
from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
from pathlib import Path
from datetime import datetime
import time

from openai import OpenAI
import os

# Flask
app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "user_file_uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

# Flask with CORS for React
cors = CORS(app, origins="*")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route('/api/summarize-transcripts-batch', methods=['POST', 'OPTIONS'])
def summarize_transcripts_batch():
    try:
        if request.method == 'OPTIONS':
            return jsonify({"status": "ok"}), 200
            
        data = request.get_json()
        transcripts_data = data.get('transcripts', [])
        
        if not transcripts_data:
            return jsonify({"error": "No transcripts provided"}), 400
        
        summaries = {}
        
        for transcript in transcripts_data:
            transcript_id = transcript.get('id')
            title = transcript.get('title', 'Unknown Debate')
            sections = transcript.get('sections', [])
            
            if not sections:
                summaries[transcript_id] = "Summary not available for this transcript."
                continue
            
            full_text = " ".join(
                section.get('content', '') for section in sections
            )[:6000]
            
            if not full_text.strip():
                summaries[transcript_id] = "Summary not available for this transcript."
                continue
            
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": """You are a expert debate analyst. Create TWO concise sentences summarizing the key clash and main topics."""
                        },
                        {
                            "role": "user",
                            "content": f"""
                            Debate: {title}
                            Create TWO concise sentences:
                            - First sentence: main conflict/outcome
                            - Second sentence: key topics discussed
                            Transcript excerpt: "{full_text[:4000]}"
                            """
                        }
                    ],
                    max_tokens=60,
                    temperature=0.7
                )
                
                summary = response.choices[0].message.content.strip()
                summaries[transcript_id] = summary
                                
            except Exception as e:
                summaries[transcript_id] = "Candidates exchanged views on key policy differences."
        
        return jsonify({
            "success": True,
            "summaries": summaries
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": f"Failed to generate summaries: {str(e)}"
        }), 500

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
def setup_database(csv_path=None):
    print("Setting up Debate AI Database...")
    
    # Initialize database connection
    database = DebateDatabase()
    
    if database.test_connection():
        print("\nLoading data from CSV file...")

        # Load CSV file
        if csv_path is None:
            csv_path = "debate_transcript_clean.csv"

        # Load CSV file
        inserter = DataInserter()
        inserter.process_transcript_file(csv_path)

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

@app.route('/api/upload-debate', methods=['POST'])
def upload_debate():
    """
    Upload debate transcript with metadata (name and date)
    Processes the file through the entire pipeline:
    1. Saves the file
    2. Runs preprocessing with debate name and date
    3. Sets up database
    4. Builds FAISS index
    """
    try:
        # Get form data
        uploaded_file = request.files.get('file')
        debate_name = request.form.get('debate_name', '').strip()
        debate_date = request.form.get('debate_date', '').strip()
        
        print(f"Received debate upload request:")
        print(f"  - File: {uploaded_file.filename if uploaded_file else 'None'}")
        print(f"  - Debate Name: {debate_name}")
        print(f"  - Debate Date: {debate_date}")
        
        # Validation
        if not uploaded_file:
            return jsonify({"error": "No file uploaded"}), 400
        
        if not debate_name:
            return jsonify({"error": "Debate name is required"}), 400
        
        if not debate_date:
            return jsonify({"error": "Debate date is required"}), 400
        
        filename = uploaded_file.filename
        
        # Restrict file types
        if not filename.lower().endswith(".txt"):
            return jsonify({"error": "Only .txt files are allowed"}), 400
        
        # Validate date format
        try:
            datetime.strptime(debate_date, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        # Save file with timestamp to prevent overwriting
        safe_name = f"{int(time.time())}_{filename}"
        file_path = UPLOAD_FOLDER / safe_name
        
        print(f"Saving file to: {file_path}")
        uploaded_file.save(file_path)
        
        # Get file size
        file_size = file_path.stat().st_size
        
        # Process the debate through the pipeline
        try:
            print(f"\n{'='*80}")
            print(f"PROCESSING DEBATE: {debate_name} ({debate_date})")
            print(f"{'='*80}\n")
            
            # Step 1: Preprocessing - pass the file path
            print("Step 1/3: Running preprocessing...")
            preprocess_result = preprocess(debate_name, debate_date, str(file_path))
            print("Preprocessing complete")
            print(f"  - Processed {preprocess_result['speaker_count']} speaker turns")
            print(f"  - CSV: {preprocess_result['csv_path']}")
            print(f"  - JSON: {preprocess_result['json_path']}")
            
            # Step 2: Database setup
            print("\nStep 2/3: Setting up database...")
            setup_database(preprocess_result['csv_path'])
            print("Database setup complete")
            
            # Step 3: Build FAISS index
            print("\nStep 3/3: Building FAISS index...")
            try:
                from backend.embeddings_faiss.incremental_index import update_faiss_incrementally
                new_count = update_faiss_incrementally()
                if new_count > 0:
                    print(f"Incrementally updated FAISS index with {new_count} new chunks")
                else:
                    print("FAISS index is already up to date")
            except ImportError as e:
                print(f"Incremental update not available: {e}")
                print("Falling back to full rebuild...")
                build_index()
            except Exception as e:
                print(f"Incremental update failed: {e}")
                print("Falling back to full rebuild...")
                build_index()
            
            print(f"\n{'='*80}")
            print(f"DEBATE PROCESSING COMPLETE")
            print(f"{'='*80}\n")
            
            return jsonify({
                "success": True,
                "message": f"Debate '{debate_name}' ({debate_date}) processed successfully!",
                "debate_name": debate_name,
                "debate_date": debate_date,
                "file_size": file_size,
                "filename": filename
            }), 200
            
        except Exception as processing_error:
            print(f"Error during pipeline processing: {processing_error}")
            return jsonify({
                "error": f"Pipeline processing failed: {str(processing_error)}"
            }), 500
    
    except Exception as e:
        print(f"Error in upload_debate: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/retrieve-response', methods=['POST'])
def retrieve_response():
    """
    Q&A Mode - Query the processed debate using retriever + QA pipeline
    """
    try:
        user_query = request.form.get('user_query', '').strip()
        print(f"\n{'='*80}")
        print(f"Q&A MODE - User Query: {user_query}")
        print(f"{'='*80}\n")
        
        if not user_query:
            return jsonify({"error": "No query provided"}), 400
        
        # Step 1: Run retriever to get relevant passages
        print("Step 1/3: Running retriever...")
        top_k = 10  # Number of relevant passages to retrieve
        retriever_results = run_retriever(user_query, top_k)
        print(f"Retrieved {len(retriever_results) if retriever_results else 0} relevant passages")
        
        # Step 2: Check if ChromaDB needs rebuilding
        print("\nStep 2/3: Checking ChromaDB status...")
        try:
            from pathlib import Path
            
            chroma_path = Path("backend/chroma")
            passages_path = Path("passages.json")
            
            # Check if we need to rebuild
            needs_rebuild = False
            
            if not chroma_path.exists():
                print("ChromaDB doesn't exist - will create fresh database")
                needs_rebuild = True
            elif not passages_path.exists():
                print("Error: passages.json not found!")
                return jsonify({"error": "passages.json not found"}), 500
            else:
                # Check if passages.json is newer than ChromaDB
                passages_mtime = passages_path.stat().st_mtime
                chroma_mtime = chroma_path.stat().st_mtime
                
                if passages_mtime > chroma_mtime:
                    print("passages.json is newer than ChromaDB - will rebuild")
                    needs_rebuild = True
                else:
                    print("ChromaDB is up to date - skipping rebuild")
            
            if needs_rebuild:
                print("Building ChromaDB with OpenAI embeddings...")
                build_chroma_db(force_rebuild=True)
                print("✅ ChromaDB built successfully with OpenAI embeddings")
            else:
                print("✅ Using existing ChromaDB")
                
        except Exception as db_error:
            print(f"Error: ChromaDB setup failed: {db_error}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "error": f"ChromaDB setup failed: {str(db_error)}"
            }), 500
        
        # Step 3: Run QA pipeline
        print("\nStep 3/3: Running QA pipeline...")
        qa_response = query_rag(user_query)
        print(f"Generated answer")
        print(f"\nAnswer: {qa_response[:200]}{'...' if len(qa_response) > 200 else ''}\n")
        
        return jsonify({
            "success": True,
            "response": qa_response,
            "query": user_query
        }), 200
        
    except Exception as e:
        print(f"\nError in Q&A pipeline: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Q&A pipeline error: {str(e)}"
        }), 500


@app.route('/api/fact-check', methods=['POST'])
def fact_check():
    """
    Fact Checker Mode - Verify claims using Wikipedia, NewsAPI, and LLM
    """
    try:
        user_claim = request.form.get('user_query', '').strip()
        print(f"\n{'='*80}")
        print(f"FACT CHECKER MODE - Claim: {user_claim}")
        print(f"{'='*80}\n")
        
        if not user_claim:
            return jsonify({"error": "No claim provided"}), 400
        
        # Initialize EnhancedFactChecker
        print("Initializing fact checker...")
        fact_checker = EnhancedFactChecker(
            use_wikipedia=True,
            use_news_api=True,
            use_llm_verification=True,
            use_semantic_similarity=True
        )
        
        # Run fact check with user's claim directly (no extraction)
        print("Running fact check with multiple sources...")
        result = fact_checker.check_claim(user_claim, top_k=3)
        
        # Format the result for frontend
        formatted_result = format_fact_check_result(result)
        
        print(f"\nFact check complete")
        print(f"Verdict: {result.verdict} ({result.confidence:.1f}% confidence)\n")
        
        return jsonify({
            "success": True,
            "response": formatted_result,
            "claim": user_claim,
            "verdict": result.verdict,
            "confidence": result.confidence,
            "badge": result.badge
        }), 200
        
    except Exception as e:
        print(f"\nError in fact checking: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Fact checking error: {str(e)}"
        }), 500


def format_fact_check_result(result):
    """
    Format FactCheckResult into a nice response for the frontend.
    
    Args:
        result: FactCheckResult dataclass from EnhancedFactChecker
        
    Returns:
        Formatted string for display
    """
    output = []
    
    # Header with verdict
    output.append(f"FACT CHECK RESULT")
    output.append(f"Claim: {result.claim}\n")
    output.append(f"Verdict: {result.verdict} {result.badge}")
    output.append(f"Confidence: {result.confidence:.1f}%\n")
    
    # Explanation
    if result.explanation:
        output.append(f"Explanation:")
        output.append(f"{result.explanation}\n")
    
    # Evidence for
    if result.evidence_for:
        output.append(f"Supporting Evidence:")
        for i, evidence in enumerate(result.evidence_for[:3], 1):
            output.append(f"{i}. {evidence}")
        output.append("")
    
    # Evidence against
    if result.evidence_against:
        output.append(f"Contradicting Evidence:")
        for i, evidence in enumerate(result.evidence_against[:3], 1):
            output.append(f"{i}. {evidence}")
        output.append("")
    
    # Sources
    if result.sources:
        output.append(f"Sources Used ({len(result.sources)} total):")
        for i, source in enumerate(result.sources[:5], 1):
            output.append(f"\n{i}. {source['title']} ({source['source']})")
            output.append(f"    URL: {source['url']}")
            
            # Find and show ONLY the matching judgment for THIS source
            if result.per_source:
                for entry in result.per_source:
                    if entry.get('url') == source.get('url') or entry.get('title') == source.get('title'):
                        output.append(f"    Judgment: {entry['label']} (score: {entry['score']:.2f})")
                        break  # Stop after finding the match
    
    return "\n".join(output)

'''
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
'''

if __name__ == "__main__":
    app.run(debug=False, port=3000)