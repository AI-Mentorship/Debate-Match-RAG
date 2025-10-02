# This file will contain data insertion functions :D
import csv
import os
import uuid
from datetime import datetime
from .connection import DebateDatabase

class DataInserter(DebateDatabase):
    def process_transcript_file(self, csv_file_path):
        if not os.path.exists(csv_file_path):
            print(f"CSV file not found at: {csv_file_path}")
            print("Please make sure the file exists in debate_ai/data folder")
            return

        # Load clean CSV file
        try:
            with open(csv_file_path, "r", encoding="utf-8") as file:
                csv_reader = csv.DictReader(file)

                for row_num, row_data in enumerate(csv_reader, 1):
                    # Each row is a separate chunk
                    chunk_id = self.generate_unique_id()
                    date = datetime.strptime(row_data["date"], "%Y-%m-%d")

                    # Insert into transcripts
                    self.transcripts.insert_one({
                        "speaker": row_data["speaker"],
                        "date": date,
                        "topic": row_data["topic"],
                        "chunk_text": row_data["text"],
                        "chunk_id": chunk_id
                    })

                    # Generate embedding vector
                    embedding_vector = self.call_openai_embedding_api(row_data["text"])

                    # Insert into embeddings
                    self.embeddings.insert_one({
                        "chunk_id": chunk_id,
                        "embedding": embedding_vector,
                        "dimension": len(embedding_vector)
                    })

                    # Insert into metadata
                    self.metadata.insert_one({
                        "chunk_id": chunk_id,
                        "source": row_data["source"],
                        "timestamp": row_data["timestamp"],
                        "tags": self.extract_keywords(row_data["text"])
                    })

                    print(f"Processed {row_data["speaker"]} at {row_data["timestamp"]} on {date}: {chunk_id}")

        except FileNotFoundError:
            print(f"CSV file not found: {csv_file_path}")

        except Exception as e:
            print(f"Error loading CSV: {e}")


    def generate_unique_id(self):
        return f"chunk_{uuid.uuid4().hex[:8]}"
    
    def call_openai_embedding_api(self, text):
        pass

    def extract_keywords(self, text):
        pass