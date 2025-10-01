from pymongo import MongoClient
from config import Config

class DebateDatabase:
    def __init__(self):
        self.client = MongoClient(Config.MONGODB_URI)
        self.db = self.client[Config.DATABASE_NAME]
        self.transcripts = self.db["transcripts"]
        self.embeddings = self.db["embeddings"]
        self.metadata = self.db["metadata"]
        
    def test_connection(self):
        try:
            self.client.admin.command('ping')
            print("Successfully connected to MongoDB!")
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False
            
    def close_connection(self):
        self.client.close()
        print("Connection closed.")