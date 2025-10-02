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
                    debate_id = self.insert_debate(row["source"], row["date"], debates_dict)
                    
                    # Insert utterance
                    self.insert_utterance(debate_id, speaker_id, row["text"], row["timestamp"])
                    
                    print(f"Added: {row["speaker"]} - {row["timestamp"]}")

            print(f"Done: {len(speakers_dict)} speakers, {len(debates_dict)} debates")

        except FileNotFoundError:
            print(f"CSV file not found: {csv_file_path}")
            print("Please make sure the file exists in debate_ai/data folder")

        except Exception as e:
            print(f"Error loading CSV: {e}")

    def insert_speaker(self, speaker, speakers_dict):
        # Check duplicate
        if speaker in speakers_dict:
            return speakers_dict[speaker]
        
        speaker_id = self.generate_unique_id()
        self.speakers.insert_one({
            "speaker_id": speaker_id,
            "name": speaker,
            "role": "Candidate" # Will update the CSV file later
        })

        speakers_dict[speaker] = speaker_id
        return speaker_id
    
    def insert_debate(self, source, date, debates_dict):
        key = (source, date)

        # Check duplicate
        if key in debates_dict:
            return debates_dict[key]
        
        debate_id = self.generate_unique_id()
        self.debates.insert_one({
            "debate_id": debate_id,
            "name": source,
            "date": datetime.strptime(date, "%Y-%m-%d")
        })

        debates_dict[key] = debate_id
        return debate_id
    
    def insert_utterance(self, debate_id, speaker_id, text, timestamp):
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
    
    def test(self, speaker_name, debate_name=None):
        pass