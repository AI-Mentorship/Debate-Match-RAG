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


def extract_speaker_turns(cleaned_text):
    """
    Split cleaned text into speaker turns with timestamps.
    Handles multiple formats automatically.
    
    Args:
        cleaned_text: Cleaned transcript text
        
    Returns:
        List of dicts with speaker, timestamp, and text
    """
    turns = []
    lines = cleaned_text.split('\n')
    
    current_speaker = None
    current_timestamp = None
    current_text = []
    line_number = 0
    
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
                        line_number += 1
                        turns.append({
                            'line_number': line_number,
                            'speaker': current_speaker,
                            'timestamp': current_timestamp if current_timestamp else 'N/A',
                            'text': text
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
            line_number += 1
            turns.append({
                'line_number': line_number,
                'speaker': current_speaker,
                'timestamp': current_timestamp if current_timestamp else 'N/A',
                'text': text
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
            fieldnames = ['line_number', 'speaker', 'timestamp', 'text']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
    
    print(f"✅ CSV saved to: {output_path}")


def save_as_json(data, output_path):
    """
    Save structured data as JSON file.
    
    Args:
        data: List of dictionaries with speaker turns
        output_path: Path to output JSON file
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ JSON saved to: {output_path}")


def detect_format(text):
    """
    Detect and display the format of the transcript for debugging.
    
    Args:
        text: Sample text from transcript
    """
    lines = text.split('\n')[:20]  # Check first 20 lines
    
    print("\n🔍 Detecting transcript format...")
    print("First few non-empty lines:")
    count = 0
    for line in lines:
        line = line.strip()
        if line and not line.startswith('='):
            print(f"   {line[:100]}")
            count += 1
            if count >= 5:
                break


def preprocess():
    """
    Main preprocessing function.
    """
    # Check for input file argument
    if len(sys.argv) < 2:
        print("Usage: python preprocess.py <input_file.txt>")
        print("Example: python preprocess.py debate_raw.txt")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    
    # Verify input file exists
    if not input_file.exists():
        print(f"❌ Error: Input file '{input_file}' not found!")
        sys.exit(1)
    
    print(f"📄 Reading: {input_file}")
    
    # Read raw transcript
    with open(input_file, 'r', encoding='utf-8') as f:
        raw_text = f.read()
    
    # Show format detection
    detect_format(raw_text)
    
    print("\n🧹 Cleaning transcript...")
    cleaned_text = clean_transcript(raw_text)
    
    print("✂️  Extracting speaker turns...")
    speaker_turns = extract_speaker_turns(cleaned_text)
    
    if not speaker_turns:
        print("\n⚠️  Warning: No speaker turns found!")
        print("\nExpected formats:")
        print("  - Speaker Name ([timestamp]): text")
        print("  - Speaker Name (timestamp): text")
        print("  - Speaker Name: text")
        print("  - [timestamp] Speaker Name: text")
        print("\nShowing cleaned text sample:")
        print(cleaned_text[:500])
        sys.exit(1)
    
    print(f"📊 Found {len(speaker_turns)} speaker turns")
    
    # Generate output filenames
    base_name = input_file.stem  # filename without extension
    output_csv = input_file.parent / f"{base_name}_clean.csv"
    output_json = input_file.parent / f"{base_name}_clean.json"
    
    # Save both formats
    print("\n💾 Saving output files...")
    save_as_csv(speaker_turns, output_csv)
    save_as_json(speaker_turns, output_json)
    
    print("\n✨ Done! Preprocessing complete.")
    print(f"\nOutput files:")
    print(f"  - {output_csv}")
    print(f"  - {output_json}")
    
    # Show sample of first 3 entries
    print("\n📋 Sample output (first 3 entries):")
    for i, turn in enumerate(speaker_turns[:3], 1):
        print(f"\n{i}. Speaker: {turn['speaker']}")
        print(f"   Timestamp: {turn['timestamp']}")
        print(f"   Text: {turn['text'][:100]}...")


if __name__ == "__main__":
    preprocess()
