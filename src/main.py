from backend.database.connection import DebateDatabase
from backend.database.insert import DataInserter
from flask import Flask, jsonify, request
from flask_cors import CORS

# Flask with frontend paths
app = Flask(__name__)

# React can fetch from Flask with CORS
cors = CORS(app, origins="*")

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

@app.route("/api/message", methods=["GET"])
def message():
    return jsonify(
        {
            "message": [
                "Hello",
                "World",
                "main.py"
            ]
        }
    )

if __name__ == "__main__":
    setup_database()
    app.run(debug=False, port=3000)