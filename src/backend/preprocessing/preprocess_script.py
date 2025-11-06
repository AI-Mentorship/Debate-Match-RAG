"""
Debate Transcript Preprocessing Script
Person A - Transcript Preprocessing Task

This script cleans raw debate transcripts and converts them to structured CSV/JSON format.
Handles multiple transcript formats automatically.
"""

import re
import csv
import json
import sys
from pathlib import Path
from datetime import datetime
from transformers import pipeline
import warnings
import torch


def clean_transcript(raw_text):
    """
    Remove noise from raw transcript text.
    
    Args:
        raw_text: String containing raw transcript
        
    Returns:
        Cleaned text with noise removed
    """
    # First, protect timestamps by converting [HH:MM:SS] to (HH:MM:SS) in speaker lines
    # This preserves them before we remove other bracketed content
    text = re.sub(r'([A-Za-z\s\.\']+)\s*\(\[?([\d:]+)\]?\):', r'\1 (\2):', raw_text)
    
    # Now remove everything else between square brackets (stage directions, technical notes)
    text = re.sub(r'\[.*?\]', '', text)
    
    # Remove commercial break markers
    text = re.sub(r'\*\*PAID FOR BY.*?\*\*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\*\*CNN FACT CHECK:.*?\*\*', '', text)
    text = re.sub(r'\*\*.*?\*\*', '', text)  # Any other **text**
    text = re.sub(r'ADVERTISEMENT BREAK', '', text, flags=re.IGNORECASE)
    text = re.sub(r'COMMERCIAL BREAK.*', '', text, flags=re.IGNORECASE)
    
    # Remove header/footer lines with equals signs
    text = re.sub(r'=+.*?=+', '', text)
    
    # Remove standalone announcer/narrator lines
    text = re.sub(r'^ANNOUNCER.*?$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^Transcribed by.*?$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^For full video.*?$', '', text, flags=re.MULTILINE)
    
    # Remove lines that are just URLs or promotional text
    text = re.sub(r'^Visit.*?\.com.*?$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^Live from.*?$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\w+ \d+, \d{4}$', '', text, flags=re.MULTILINE)  # Dates
    
    # Remove extra whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)  # Multiple newlines to double newline
    text = text.strip()
    
    return text

warnings.filterwarnings("ignore")

# Initialize AI classifier once at module level
print("Loading topic classification model...")
device = 0 if torch.cuda.is_available() or torch.backends.mps.is_available() else -1
topic_classifier = pipeline(
    "zero-shot-classification", 
    model="facebook/bart-large-mnli",
    device=device
)
print("Topic classifier loaded!")

def classify_topics_batch(text, threshold=0.3):

    # Reduced to most important topics only
    candidate_labels = [
        "economy and jobs",
        "healthcare",
        "immigration",
        "foreign policy",
        "climate change",
        "education",
        "crime and justice",
        "taxes",
        "abortion",
        "gun rights",
        "civil rights",
        "election integrity",
        "social security",
        "military and defense",
        "general politics"
    ]
    
    all_topics = []
    
    try:
        # Process in batches
        for text in text:
            result = topic_classifier(
                text[:512],
                candidate_labels,
                multi_label=True
            )
            
            topics = [
                label.replace(" and ", "_").replace(" ", "_")
                for label, score in zip(result['labels'], result['scores']) 
                if score > threshold
            ]
            
            all_topics.append(topics[:3] if topics else ["general_political_commentary"])
            
    except Exception as e:
        print(f"⚠️  Batch classification failed: {e}")
        all_topics = [["general_political_commentary"] for _ in text]
    
    return all_topics


def extract_speaker_turns(cleaned_text, source):
    """
    Split cleaned text into speaker turns with timestamps.
    Handles multiple formats automatically.
    
    Args:
        cleaned_text: Cleaned transcript text
        source: Name of the debate/source
        
    Returns:
        List of dicts with speaker, timestamp, text, and source
    """
    turns = []
    lines = cleaned_text.split('\n')
    
    current_speaker = None
    current_timestamp = None
    current_text = []
    
    # Multiple patterns to handle different transcript formats
    patterns = [
        # Pattern 1: Speaker Name ([timestamp]): text
        r'^([A-Za-z\s\.\']+)\s*\(\[?([\d:]+)\]?\):\s*(.*)$',
        # Pattern 2: Speaker Name (timestamp): text (no brackets)
        r'^([A-Za-z\s\.\']+)\s*\(([\d:]+)\):\s*(.*)$',
        # Pattern 3: Speaker Name: text (no timestamp)
        r'^([A-Za-z\s\.\']+):\s*(.*)$',
        # Pattern 4: [timestamp] Speaker Name: text
        r'^\[?([\d:]+)\]?\s+([A-Za-z\s\.\']+):\s*(.*)$',
    ]
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        matched = False
        
        # Try each pattern
        for pattern_idx, pattern in enumerate(patterns):
            match = re.match(pattern, line)
            
            if match:
                # Save previous speaker's text if it exists
                if current_speaker and current_text:
                    text = ' '.join(current_text).strip()
                    if text:
                        turns.append({
                            'speaker': current_speaker,
                            'timestamp': current_timestamp if current_timestamp else 'N/A',
                            'text': text,
                            'source': source
                        })
                
                # Extract based on which pattern matched
                if pattern_idx == 0 or pattern_idx == 1:
                    # Patterns with speaker, timestamp, text
                    current_speaker = match.group(1).strip()
                    current_timestamp = match.group(2).strip()
                    current_text = [match.group(3)] if match.group(3) else []
                elif pattern_idx == 2:
                    # Pattern with just speaker and text (no timestamp)
                    current_speaker = match.group(1).strip()
                    current_timestamp = 'N/A'
                    current_text = [match.group(2)] if match.group(2) else []
                elif pattern_idx == 3:
                    # Pattern with timestamp first, then speaker
                    current_timestamp = match.group(1).strip()
                    current_speaker = match.group(2).strip()
                    current_text = [match.group(3)] if match.group(3) else []
                
                matched = True
                break
        
        if not matched and current_speaker:
            # This is a continuation of the current speaker's text
            current_text.append(line)
    
    # Don't forget the last speaker's text
    if current_speaker and current_text:
        text = ' '.join(current_text).strip()
        if text:
            turns.append({
                'speaker': current_speaker,
                'timestamp': current_timestamp if current_timestamp else 'N/A',
                'text': text,
                'source': source
            })
    
    return turns


def save_as_csv(data, output_path):
    """
    Save structured data as CSV file.
    
    Args:
        data: List of dictionaries with speaker turns
        output_path: Path to output CSV file
    """
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        if data:
            fieldnames = ['speaker', 'timestamp', 'text', 'source', 'topics']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            # Convert topics list to comma-separated string for CSV
            for row in data:
                row_copy = row.copy()
                row_copy['topics'] = ','.join(row['topics'])
                writer.writerow(row_copy)


def save_as_json(data, output_path):
    """
    Save structured data as JSON file.
    
    Args:
        data: List of dictionaries with speaker turns
        output_path: Path to output JSON file
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def preprocess(debate_name):
    # Main preprocessing function.

    # Check for input file argument
    if len(sys.argv) < 2:
        print("Usage: python main.py <input_file.txt>")
        print("Example: python main.py debate_raw.txt")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    
    # Verify input file exists
    if not input_file.exists():
        print(f"Error: Input file '{input_file}' not found!")
        sys.exit(1)
    
    # Use debate_name from parameter or prompt user
    if debate_name:
        source = debate_name
        print(f"Using debate name: {source}")
    else:
        source = input("\nEnter Debate name/source: ").strip()
        if not source:
            source = "Unknown Debate"
            print(f"No source provided, using: {source}")

    print(f"Reading: {input_file}")
    
    # Read raw transcript
    with open(input_file, 'r', encoding='utf-8') as f:
        raw_text = f.read()
    
    print("\n🧹 Cleaning transcript...")
    cleaned_text = clean_transcript(raw_text)
    
    print("✂️  Extracting speaker turns...")
    speaker_turns = extract_speaker_turns(cleaned_text, source)
    
    if not speaker_turns:
        print("\nWarning: No speaker turns found!")
        print("\nExpected formats:")
        print("  - Speaker Name ([timestamp]): text")
        print("  - Speaker Name (timestamp): text")
        print("  - Speaker Name: text")
        print("  - [timestamp] Speaker Name: text")
        print("\nShowing cleaned text sample:")
        print(cleaned_text[:500])
        sys.exit(1)
    
    print(f"📊 Found {len(speaker_turns)} speaker turns")
    print(f"   Source: {source}")
    
    # Classify topics in batch (much faster)
    print("🏷️  Classifying topics (this may take a moment)...")
    texts = [turn['text'] for turn in speaker_turns]
    all_topics = classify_topics_batch(texts)
    
    # Add topics to turns
    for turn, topics in zip(speaker_turns, all_topics):
        turn['topics'] = topics
    
    print(f"✅ Topic classification complete!")
    
    # Generate output filenames
    base_name = input_file.stem  # filename without extension
    output_csv = input_file.parent / f"{base_name}_clean.csv"
    output_json = input_file.parent / f"{base_name}_clean.json"
    
    # Save both formats
    save_as_csv(speaker_turns, output_csv)
    save_as_json(speaker_turns, output_json)
    
    print("\n✨ Done! Preprocessing complete.")
    print(f"\nOutput files:")
    print(f"  - {output_csv}")
    print(f"  - {output_json}\n")

if __name__ == "__main__":
    preprocess()