# This file will contain data insertion functions :D
import csv
import uuid
from datetime import datetime
from .connection import DebateDatabase

class DataInserter(DebateDatabase):
    def __init__(self):
        super().__init__() # Initialize DebateDatabase in order to use self.speakers, self.debates, and self.utterances

    def process_transcript_file(self, csv_file_path):
        speakers_dict = {}  # speaker_id = name
        debates_dict = {}   # debate_id = (source, date)

        # Load clean CSV file
        try:
            with open(csv_file_path, "r", encoding="utf-8") as file:
                csv_reader = csv.DictReader(file)

                for row in csv_reader:
                    # Insert speaker
                    speaker_id = self.insert_speaker(row["speaker"], speakers_dict)
                    
                    # Insert debate
                    debate_id = self.insert_debate(row["source"], debates_dict)
                    
                    # Insert utterance
                    self.insert_utterance(debate_id, speaker_id, row["text"], row["timestamp"])

                    print(f"Added: {row['speaker']} - {row['timestamp']}")

            print(f"Done: {len(speakers_dict)} speakers, {len(debates_dict)} debates")

        except FileNotFoundError:
            print(f"CSV file not found: {csv_file_path}")
            print("Please make sure the file exists")

        except KeyError as e:
            print(f"Missing column in CSV: {e}")
            print("Expected columns: line_number, speaker, timestamp, text, source, date")

        except Exception as e:
            print(f"Error loading CSV: {e}")

    def insert_speaker(self, speaker, speakers_dict):
        # Check duplicate in the file
        if speaker in speakers_dict:
            return speakers_dict[speaker]
        
        # Check duplicate in the database
        existing_speaker = self.speakers.find_one({
            "name": speaker
        })

        if existing_speaker:
            speakers_dict[speaker] = existing_speaker["speaker_id"]
            return existing_speaker["speaker_id"]
        
        # Insert
        speaker_id = self.generate_unique_id()
        self.speakers.insert_one({
            "speaker_id": speaker_id,
            "name": speaker,
            "role": "Candidate" # Will update the CSV file later
        })

        speakers_dict[speaker] = speaker_id
        return speaker_id
    
    def insert_debate(self, source, debates_dict):
        key = source

        # Check duplicate
        if key in debates_dict:
            return debates_dict[key]
        
        # Check duplicate in the database
        existing_debate = self.debates.find_one({
            "name": source
        })

        if existing_debate:
            debates_dict[key] = existing_debate["debate_id"]
            return existing_debate["debate_id"]

        # Insert
        debate_id = self.generate_unique_id()
        self.debates.insert_one({
            "debate_id": debate_id,
            "name": source
        })

        debates_dict[key] = debate_id
        return debate_id
    
    def insert_utterance(self, debate_id, speaker_id, text, timestamp):
        # Check duplicate in the database
        existing_utterance = self.utterances.find_one({
            "debate_id": debate_id,
            "speaker_id": speaker_id, 
            "text": text,
            "timestamp": timestamp
        })

        if existing_utterance:
            return

        # Insert
        utterance_id = self.generate_unique_id()
        self.utterances.insert_one({
            "utterance_id": utterance_id,
            "debate_id": debate_id,
            "speaker_id": speaker_id,
            "text": text,
            "timestamp": timestamp
        })

    def generate_unique_id(self):
        return f"chunk_{uuid.uuid4().hex[:8]}"