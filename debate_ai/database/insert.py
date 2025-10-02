# This file will contain data insertion functions :D
import uuid
from datetime import datetime
from .connection import DebateDatabase

class DataInserter(DebateDatabase):
    def process_transcript_file(self, transcript_file):
        # Split transcript_file into chunks (max ~500 tokens each)
        chunks = self.split_into_chunks(transcript_file)

        for chunk in chunks:
            chunk_id = self.generate_unique_id()

            # Insert into transcripts
            
            # Generate embedding vector

            # Insert into embeddings

            # Insert into metadata

    def generate_unique_id(self):
        pass

    def split_into_chunks(self, transcript_file, max_tokens=500):
        pass

    def call_openai_embedding_api(self, text):
        pass

    def insert_transcript_data(self, speaker, date, topic, chunk_text, source, embedding_vector, tags=None):
        pass
    
    def load_sample_data(self):
        sample_transcript = type('MockFile', (), {
            "name": "2020 Presidential Debate #1",
            "date": datetime(2020, 9, 29),
            "topic": "General Debate",
            "speaker": "Donald Trump",
            "text": "We need to ensure affordable healthcare for all Americans. Our economy depends on it. Climate change is real and we must act now."
        })()
        
        self.process_transcript_file(sample_transcript)