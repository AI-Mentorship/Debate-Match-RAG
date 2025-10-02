# This file will contain data insertion functions :D
import csv
import os
import uuid
from datetime import datetime
from .connection import DebateDatabase

class DataInserter(DebateDatabase):
    def process_transcript_file(self, csv_file_path):
        # Load clean CSV file
        try:
            with open(csv_file_path, "r", encoding="utf-8") as file:
                csv_reader = csv.DictReader(file)

                for row_num, row_data in enumerate(csv_reader, 1):
                    # Each row is a separate chunk
                    chunk_id = self.generate_unique_id()

                    # Insert into transcripts
                    self.transcripts.insert_one({
                        "speaker": row_data["speaker"],
                        "date": datetime.strptime(row_data['date'], '%Y-%m-%d'),
                        "topic": row_data["topic"],
                        "chunk_text": row_data["text"],
                        "chunk_id": chunk_id
                    })

                    # Generate embedding vector
                    embedding_vector = self.call_openai_embedding_api(row_data["text"])

                    # Insert into embeddings

                    # Insert into metadata

        except FileNotFoundError:
            print(f"CSV file not found: {csv_file_path}")

        except Exception as e:
            print(f"Error loading CSV: {e}")


    def generate_unique_id(self):
        return f"chunk_{uuid.uuid4().hex[:8]}"
    
    def call_openai_embedding_api(self):
        pass