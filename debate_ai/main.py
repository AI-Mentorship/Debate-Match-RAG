from src.backend.database.connection import DebateDatabase
from src.backend.database.insert import DataInserter

def main():
    print("Setting up Debate AI Database...")
    
    # Initialize database connection
    database = DebateDatabase()
    
    if database.test_connection():
        print("\nLoading data from CSV file...")

        # Load CSV file
        inserter = DataInserter()
        inserter.process_transcript_file("debate_ai/data/sample_data.csv")

        print("Database setup complete!")
        print("\nAvailable collections:")
        collections = database.db.list_collection_names()
        for collection in collections:
            count = database.db[collection].count_documents({})
            print(f"  - {collection}: {count} documents")
    
    else:
        print("Database setup failed!")
    
    database.close_connection()

if __name__ == "__main__":
    main()