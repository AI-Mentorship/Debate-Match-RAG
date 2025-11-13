
# src/backend/server.py
import os
import tempfile
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path

from backend.database.connection import DebateDatabase

# Try importing your existing modules
try:
    from backend.preprocessing.preprocess_script import preprocess
except Exception:
    preprocess = None
    print("preprocess1:", bool(preprocess))
    
try:
    from main import setup_database, get_debate_name, get_user_query
except Exception:
    setup_database = None
    get_debate_name = None
    get_user_query = None

try:
    from backend.embeddings_faiss.build_index import build_index
except Exception:
    build_index = None

try:
    from backend.qa_pipeline.QA_pipeline import build_chroma_db, query_rag
except Exception:
    build_chroma_db = None
    query_rag = None

try:
    from backend.retriever.retriever import run_retriever
except Exception:
    run_retriever = None

app = Flask(__name__)
CORS(app)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/retrieve-response", methods=["POST"])
def retrieve_response():
    """
    This endpoint connects:
      - Preprocessing
      - Database Insertion
      - Embeddings build
      - Retriever + RAG Query
    """

    result = {"answer": None, "per_source": [], "metadata": {}}
    try:
        #user_query = request.form.get("user_query", "")
        user_query = get_user_query(request.form.get("user_query"))
        file = request.files.get("file")

        # Save uploaded file (if any)
        saved_path = None
        if file:
            tmp_dir = tempfile.mkdtemp(prefix="debate_upload_")
            saved_path = os.path.join(tmp_dir, file.filename)
            file.save(saved_path)
            result["metadata"]["uploaded_file"] = saved_path

            # 1️⃣ Preprocess
            if preprocess:
                try:
                    import subprocess
                    result_proc = subprocess.run(["python", "backend/preprocessing/preprocess_script.py", saved_path],capture_output=True,text=True)
                    if result_proc.returncode == 0:
                        result["metadata"]["preprocess"] = "done"
                    else:
                        result["metadata"]["preprocess_error"] = result_proc.stderr
                    #debate_name = os.path.splitext(os.path.basename(saved_path))[0]
                    #preprocess(debate_name)
                    #result["metadata"]["preprocess"] = "done"
                except Exception as e:
                    result["metadata"]["preprocess_error"] = str(e)
            
            if get_debate_name:
                try:
                    debate_name = get_debate_name()
                    result["metadata"]["debate_name"] = debate_name
                except Exception as e:
                    result["metadata"]["debate_name_error"] = str(e)


            # 2️⃣ Insert into database
            if setup_database:
                try:
                    if get_debate_name:
                        debate_name = get_debate_name()
                        result["metadata"]["debate_name"] = debate_name
                    else:
                        result["metadata"]["debate_name_warning"] = "get_debate_name not available"

                    setup_database()
                    result["metadata"]["database"] = "setup_complete"
                   #setup_database()
                   #result["metadata"]["database"] = "setup_complete"
                    
                    #inserter = DataInserter()
                    #if hasattr(inserter, "process_transcript_file"):
                     #   inserter.process_transcript_file(saved_path)
                      #  result["metadata"]["db_insert"] = "done"
                except Exception as e:
                    result["metadata"]["db_insert_error"] = str(e)

            if get_user_query:
                try:
                    user_query = get_user_query()
                    result["metadata"]["user_query"] = user_query
                except Exception as e:
                    result["metadata"]["user_query_error"] = str(e)


        # 3️⃣ Build embeddings / index
        if build_index:
            try:
                build_index()
                result["metadata"]["faiss_index"] = "built"
            except Exception as e:
                result["metadata"]["faiss_error"] = str(e)

        if build_chroma_db:
            try:
                build_chroma_db()
                result["metadata"]["chroma"] = "built"
            except Exception as e:
                result["metadata"]["chroma_error"] = str(e)

        # 4️⃣ Run retriever (optional)
        if run_retriever:
            try:
                #run_retriever(user_query, 5)
                #result["metadata"]["retriever"] = "done"
                if get_user_query:
                    user_query = get_user_query(request.form.get("user_query", ""))
                    result["metadata"]["user_query"] = user_query

                run_retriever(user_query, 5)
                result["metadata"]["retriever"] = "done"
            except Exception as e:
                result["metadata"]["retriever_error"] = str(e)

        # 5️⃣ Query RAG
        if query_rag:
            try:
                response = query_rag(user_query)
                print(response)
                if isinstance(response, dict):
                    result["answer"] = response.get("answer") or response.get("result")
                    result["per_source"] = response.get("per_source", [])
                else:
                    result["answer"] = str(response)
            except Exception as e:
                result["metadata"]["rag_error"] = str(e)
                result["answer"] = "Error while generating RAG response."
        else:
            result["answer"] = "RAG function not available."

        #return jsonify(result)
        #return result["answer"]
        return jsonify({"response": result["answer"], "metadata": result["metadata"]})
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
    

