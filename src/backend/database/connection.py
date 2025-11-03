from pymongo import MongoClient
from .config import DatabaseConfig
import certifi

class DebateDatabase:
    def __init__(self):
        # Connection
        # self.client = MongoClient(DatabaseConfig.MONGODB_URI) < - more secure but broken for me :(
        self.client = MongoClient(
        DatabaseConfig.MONGODB_URI,
        tlsCAFile=certifi.where()
        )
        self.db = self.client[DatabaseConfig.DATABASE_NAME]
        
        # Tables
        self.speakers = self.db["speakers"]
        self.debates = self.db["debates"] 
        self.utterances = self.db["utterances"]

        self.indexes()

    def indexes(self):
        self.speakers.create_index("speaker_id", unique=True)
        self.debates.create_index("debate_id", unique=True)
        self.utterances.create_index("utterance_id", unique=True)
        self.utterances.create_index("debate_id")
        self.utterances.create_index("speaker_id")
    
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
        print("Connection closed.\n")