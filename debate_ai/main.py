from database.connection import DebateDatabase

def main():
    print("Setting up Debate AI Database...")
    
    # Initialize database connection and create indexes
    db = DebateDatabase()
    
    if db.test_connection():
        print("Database setup complete! Ready for data insertion and retrieval.")
        print("Available collections:")
        collections = db.db.list_collection_names()
        for collection in collections:
            print(f"  - {collection}")
    
    else:
        print("Database setup failed!")
    
    db.close_connection()

if __name__ == "__main__":
    main()