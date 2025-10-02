from database.connection import DebateDatabase
from database.insert import DataInserter

def main():
    print("Setting up Debate AI Database...")
    
    # Initialize database connection and create indexes
    db = DebateDatabase()
    
    if db.test_connection():
        print("\nLoading data from CSV file...")

        # Load CSV file
        inserter = DataInserter()
        inserter.process_transcript_file("debate_ai/data/debate_clean.csv")

        print("Database setup complete!")
        print("Available collections:")
        collections = db.db.list_collection_names()
        for collection in collections:
            count = db.db[collection].count_documents({})
            print(f"  - {collection}: {count} documents")
    
    else:
        print("Database setup failed!")
    
    db.close_connection()

if __name__ == "__main__":
    main()