from pymongo import MongoClient
from .config import DatabaseConfig

class DebateDatabase:
    def __init__(self):
        self.client = MongoClient(DatabaseConfig.MONGODB_URI)
        self.db = self.client[DatabaseConfig.DATABASE_NAME]
        self.transcripts = self.db["transcripts"]
        self.embeddings = self.db["embeddings"]
        self.metadata = self.db["metadata"]
        
        # Indexes
        self.transcripts.create_index("chunk_id", unique=True)
        self.embeddings.create_index("chunk_id", unique=True)
        self.metadata.create_index("chunk_id", unique=True)
        self.transcripts.create_index("speaker")
        self.transcripts.create_index("topic")
        self.transcripts.create_index("date")
    
    def test_connection(self):
        try:
            self.client.admin.command("ping")
            print("Successfully connected to MongoDB.")
            return True

        except Exception as e:
            print(f"Connection failed: {e}")
            return False
    
    def close_connection(self):
        self.client.close()
        print("Connection closed.")