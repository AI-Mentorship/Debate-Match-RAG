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
from transformers import pipeline # type: ignore
import warnings
import torch # type: ignore
import hashlib
import pickle
import openai # type: ignore
import os
from dotenv import load_dotenv # type: ignore

load_dotenv()

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
    
    # Remove commercial break markers only match standalone lines
    text = re.sub(r'\*\*PAID FOR BY.*?\*\*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\*\*CNN FACT CHECK:.*?\*\*', '', text)
    text = re.sub(r'\*\*.*?\*\*', '', text)  # Any other **text**
    
    # Only remove "COMMERCIAL BREAK" when it's on its own line
    text = re.sub(r'^ADVERTISEMENT BREAK.*?$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^\*\*COMMERCIAL BREAK\*\*.*?$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^COMMERCIAL BREAK$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    
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
device = 0 if torch.cuda.is_available() or torch.backends.mps.is_available() else -1
topic_classifier = pipeline(
    "zero-shot-classification", 
    model="facebook/bart-large-mnli", # model="typeform/distilbert-base-uncased-mnli", faster but less accurate, 0.3s per utterance
    device=device
)

# Cache directory
CACHE_DIR = Path(".topic_cache")
CACHE_DIR.mkdir(exist_ok=True)

def get_text_hash(text):
    # Generate a hash for text to use as cache key.
    return hashlib.md5(text.encode('utf-8')).hexdigest()

def load_cached_topics(text):
    # Load topics from cache if available.
    text_hash = get_text_hash(text)
    cache_file = CACHE_DIR / f"{text_hash}.pkl"
    
    if cache_file.exists():
        try:
            with open(cache_file, 'rb') as f:
                return pickle.load(f)
        except:
            return None
    return None

def save_cached_topics(text, topics):
    # Save topics to cache.
    text_hash = get_text_hash(text)
    cache_file = CACHE_DIR / f"{text_hash}.pkl"
    
    try:
        with open(cache_file, 'wb') as f:
            pickle.dump(topics, f)
    except:
        pass  # Silently fail if caching doesn't work

def classify_topics_batch(texts, speakers, threshold=0.3):
    """
    High-quality classification optimized for 2 cents per transcript.
    Allows 2-4 tags per turn for better topic coverage.
    
    Args:
        texts: List of texts to classify
        speakers: List of speaker names
        threshold: Minimum confidence score (for fallback only)
        
    Returns:
        List of topic lists
    """
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    if not os.getenv("OPENAI_API_KEY"):
        print("OPENAI_API_KEY not found in environment. Using fallback classifier.")
        return classify_topics_batch_fallback(texts, threshold)
    
    all_topics = [None] * len(texts)
    texts_to_process = []
    speakers_to_process = []
    indices_to_process = []
    
    topic_keywords = {
        'economy': ['economy', 'economic', 'jobs', 'employment', 'unemployment', 'inflation', 'prices', 'cost of living', 'GDP', 'recession', 'tariff', 'trade', 'deficit', 'stock market', 'middle class', 'working people', 'wages', 'salary'],
        'healthcare': ['healthcare', 'health care', 'medical', 'hospital', 'insurance', 'medicare', 'medicaid', 'obamacare', 'affordable care', 'IVF', 'prescription', 'doctor', 'coverage'],
        'immigration': ['immigration', 'immigrant', 'border', 'asylum', 'deportation', 'ICE', 'undocumented', 'illegal alien', 'migrant', 'southern border', 'border security', 'border patrol', 'visa'],
        'abortion': ['abortion', 'roe v wade', 'roe v. wade', 'pro-life', 'pro-choice', 'reproductive', 'pregnancy', 'fetus', 'miscarriage', "women's health", 'planned parenthood'],
        'climate': ['climate', 'global warming', 'emissions', 'carbon', 'renewable energy', 'fossil fuel', 'solar', 'wind energy', 'environmental', 'fracking', 'green energy'],
        'foreign_policy': ['foreign policy', 'russia', 'china', 'ukraine', 'nato', 'iran', 'north korea', 'israel', 'hamas', 'middle east', 'putin', 'xi', 'gaza', 'hostages', 'cease-fire', 'two-state', 'international', 'diplomacy'],
        'military': ['military', 'defense', 'armed forces', 'pentagon', 'troops', 'veterans', 'afghanistan', 'lethal', 'national security', 'army', 'navy', 'air force'],
        'guns': ['gun', 'second amendment', 'firearm', 'NRA', 'shooting', 'gun control', 'gun rights', 'assault weapon', 'weapon'],
        'taxes': ['tax', 'taxes', 'IRS', 'tax cut', 'tax break', 'deduction', 'tax credit', 'child tax credit', 'billionaire', 'wealthy', 'rich'],
        'crime': ['crime', 'criminal', 'police', 'law enforcement', 'defund', 'violence', 'murder', 'homicide', 'FBI', 'safety', 'law and order', 'prison', 'jail'],
        'education': ['education', 'school', 'student', 'teacher', 'university', 'college', 'student loan', 'small business', 'learning', 'classroom'],
        'elections': ['election', 'vote', 'voter', 'ballot', 'campaign', 'poll', '2020', '2024', 'fraud', 'democracy', 'peaceful transfer', 'january 6', 'fired by', 'voting', 'electoral'],
        'civil_rights': ['civil rights', 'discrimination', 'equality', 'racism', 'LGBTQ', 'transgender', 'gay marriage', 'freedom', 'constitution', 'rights', 'liberty'],
        'social_security': ['social security', 'retirement', 'pension', 'seniors', 'elderly', 'scam', 'retiree']
    }
    
    moderator_names = ['muir', 'davis', 'moderator', 'host', 'anchor', 'tapper', 'bash', 'cooper', 'wallace', 'mitchell', 'raddatz']
    moderator_keywords = ['question', 'ask', 'respond', 'turn to', 'time is up', 'thank you', 'welcome', 'let me', 'want to get', 'move to', 'next question']
    
    for i, (text, speaker) in enumerate(zip(texts, speakers)):
        word_count = len(text.split())
        text_lower = text.lower()
        speaker_lower = speaker.lower()
        
        # Very short turns (< 5 words)
        if word_count < 5:
            if any(mod_name in speaker_lower for mod_name in moderator_names):
                all_topics[i] = ["moderator"]
            elif any(response in text_lower for response in ['yes', 'no', 'thank you', 'thanks', 'okay', 'ok', 'right', 'correct', 'exactly']):
                all_topics[i] = ["general_response"]
            elif any(phrase in text_lower for phrase in ['next question', 'time is up', 'welcome']):
                all_topics[i] = ["moderator"]
            else:
                all_topics[i] = ["general_politics"]
        
        # Moderators by name
        elif any(mod_name in speaker_lower for mod_name in moderator_names):
            if any(keyword in text_lower for keyword in moderator_keywords):
                all_topics[i] = ["moderator"]
            else:
                # Moderator making substantive statement
                topic_scores = {}
                for topic, keywords in topic_keywords.items():
                    matches = sum(1 for keyword in keywords if keyword in text_lower)
                    if matches > 0:
                        topic_scores[topic] = matches
                
                if topic_scores:
                    sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)
                    all_topics[i] = [topic for topic, score in sorted_topics[:3]]
                else:
                    all_topics[i] = ["moderator"]
        
        # Short turns (5-15 words)
        elif word_count <= 15:
            topic_scores = {}
            for topic, keywords in topic_keywords.items():
                matches = sum(1 for keyword in keywords if keyword in text_lower)
                if matches > 0:
                    topic_scores[topic] = matches
            
            if topic_scores:
                sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)
                all_topics[i] = [topic for topic, score in sorted_topics[:2]]
            else:
                all_topics[i] = ["general_politics"]
        
        # Long turns (16+ words)
        else:
            texts_to_process.append(text)
            speakers_to_process.append(speaker)
            indices_to_process.append(i)
        
    batch_size = 25
    
    for i in range(0, len(texts_to_process), batch_size):
        batch_texts = texts_to_process[i:i+batch_size]
        batch_speakers = speakers_to_process[i:i+batch_size]
        batch_indices = indices_to_process[i:i+batch_size]
        
        batch_prompt = "\n\n".join([
            f"Turn {j+1}: Speaker: {speaker}\nText: {text[:600]}"
            for j, (speaker, text) in enumerate(zip(batch_speakers, batch_texts))
        ])
        
        retry_count = 0
        max_retries = 2
        
        while retry_count < max_retries:
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{
                        "role": "system", 
                        "content": """You are a debate analyst. Return 2-4 topics per speaker turn for comprehensive coverage.
                            CRITICAL: Return EXACTLY the same number of results as turns provided.

                            TOPIC RULES:
                            - Moderators (asking questions, managing): return ["moderator"]
                            - Candidates: return 2-4 topics from: economy, healthcare, immigration, foreign_policy, climate, education, crime, taxes, abortion, guns, civil_rights, elections, social_security, military, general_politics

                            TOPIC SELECTION GUIDELINES:
                            - Use 2 topics for focused statements (e.g., ["economy", "taxes"])
                            - Use 3 topics for multi-faceted arguments (e.g., ["immigration", "crime", "economy"])
                            - Use 4 topics for complex policy discussions touching many areas
                            - Be specific: 
                            * "economy" = jobs, inflation, trade, GDP, middle class
                            * "taxes" = tax cuts, deductions, tax policy
                            * "immigration" = border, deportation, asylum
                            * "abortion" = reproductive rights, Roe v Wade
                            * "elections" = voting, 2020 election, democracy, fraud
                            * "foreign_policy" = Russia, China, Ukraine, Israel, international relations
                            * "crime" = police, law enforcement, violence
                            * "guns" = gun control, Second Amendment
                            * "healthcare" = insurance, Medicare, medical care
                            * "climate" = environment, emissions, energy
                            * "education" = schools, students, loans
                            * "social_security" = retirement, seniors
                            * "civil_rights" = discrimination, equality, rights
                            * "military" = defense, armed forces, veterans
                            - Use "general_politics" only when no specific topic applies
                            - DO NOT create variations - use exact topic names only

                            Format your response as JSON: {\"results\": [[\"topic1\", \"topic2\"], [\"topic1\", \"topic2\", \"topic3\"], ...]}"""
                    }, {
                        "role": "user",
                        "content": f"Analyze these {len(batch_texts)} turns. Return EXACTLY {len(batch_texts)} results with 2-4 topics each in JSON format:\n\n{batch_prompt}"
                    }],
                    temperature=0.0,
                    max_tokens=1000,
                    response_format={"type": "json_object"}
                )
                
                result = json.loads(response.choices[0].message.content)
                batch_topics = result.get("results", [])
                
                # Validate count
                if len(batch_topics) != len(batch_texts):
                    # Retry once if off by 1
                    if abs(len(batch_topics) - len(batch_texts)) == 1 and retry_count == 0:
                        retry_count += 1
                        continue
                    
                    # Fix mismatch
                    if len(batch_topics) > len(batch_texts):
                        batch_topics = batch_topics[:len(batch_texts)]
                    else:
                        # Pad with keyword fallback
                        for idx in range(len(batch_topics), len(batch_texts)):
                            text_lower = batch_texts[idx].lower()
                            topic_scores = {}
                            for topic, keywords in topic_keywords.items():
                                matches = sum(1 for kw in keywords if kw in text_lower)
                                if matches > 0:
                                    topic_scores[topic] = matches
                            
                            if topic_scores:
                                sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)
                                batch_topics.append([t for t, s in sorted_topics[:3]])
                            else:
                                batch_topics.append(["general_politics"])
                
                # Map results back
                for j, topics in enumerate(batch_topics):
                    if j < len(batch_indices):
                        original_idx = batch_indices[j]
                        if not topics or not isinstance(topics, list):
                            topics = ["general_politics"]
                        
                        # Clean and validate topics
                        topics = [t.strip() for t in topics if t and isinstance(t, str)]
                        topics = [t for t in topics if t]  # Remove empty
                        
                        # 2 to 4 topics
                        if len(topics) < 2 and len(texts_to_process[j].split()) > 30:
                            # Add general_politics if only 1 topic for long turn
                            topics.append("general_politics")
                        elif len(topics) > 4:
                            topics = topics[:4]
                        elif not topics:
                            topics = ["general_politics"]
                        
                        all_topics[original_idx] = topics
                
                break
                
            except json.JSONDecodeError as e:
                retry_count += 1
                if retry_count >= max_retries:
                    # Keyword fallback
                    for j in range(len(batch_texts)):
                        if j < len(batch_indices):
                            text_lower = batch_texts[j].lower()
                            topic_scores = {}
                            for topic, keywords in topic_keywords.items():
                                matches = sum(1 for kw in keywords if kw in text_lower)
                                if matches > 0:
                                    topic_scores[topic] = matches
                            
                            if topic_scores:
                                sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)
                                all_topics[batch_indices[j]] = [t for t, s in sorted_topics[:3]]
                            else:
                                all_topics[batch_indices[j]] = ["general_politics"]
                    break
                    
            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    print(f"Batch failed after retries: {e}")
                    # Keyword fallback
                    for j in range(len(batch_texts)):
                        if j < len(batch_indices):
                            text_lower = batch_texts[j].lower()
                            topic_scores = {}
                            for topic, keywords in topic_keywords.items():
                                matches = sum(1 for kw in keywords if kw in text_lower)
                                if matches > 0:
                                    topic_scores[topic] = matches
                            
                            if topic_scores:
                                sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)
                                all_topics[batch_indices[j]] = [t for t, s in sorted_topics[:3]]
                            else:
                                all_topics[batch_indices[j]] = ["general_politics"]
                    break
                else:
                    import time
                    time.sleep(0.5)
    
    # Final safety check
    for i in range(len(all_topics)):
        if all_topics[i] is None or not isinstance(all_topics[i], list):
            all_topics[i] = ["general_politics"]
        # Remove duplicates while preserving order
        seen = set()
        all_topics[i] = [t for t in all_topics[i] if not (t in seen or seen.add(t))]
        if not all_topics[i]:
            all_topics[i] = ["general_politics"]
    
    return all_topics

def classify_topics_batch_fallback(texts, threshold=0.3):
    """
    Fallback classifier using the original BART model
    """
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
    cache_hits = 0
    cache_misses = 0
    
    try:
        for i, text in enumerate(texts):
            # Try to load from cache first
            cached_topics = load_cached_topics(text)
            
            if cached_topics is not None:
                all_topics.append(cached_topics)
                cache_hits += 1
            else:
                # Classify if not in cache
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
                
                final_topics = topics[:3] if topics else ["general_political_commentary"]
                all_topics.append(final_topics)
                
                # Save to cache
                save_cached_topics(text, final_topics)
                cache_misses += 1                
    except Exception as e:
        print(f"Fallback classification failed: {e}")
        all_topics = [["general_political_commentary"] for _ in texts]
    
    return all_topics

def extract_speaker_turns(cleaned_text, source, date):
    turns = []
    lines = cleaned_text.split('\n')
    
    current_speaker = None
    current_timestamp = None
    current_text = []
    
    # Multiple patterns to handle different transcript formats
    patterns = [
        # Pattern 1: Speaker Name ([timestamp]): text
        r'^([A-Z][A-Za-z\s\.\']+)\s*\(\[?([\d:]+)\]?\):\s*(.*)$',
        # Pattern 2: Speaker Name (timestamp): text (no brackets)
        r'^([A-Z][A-Za-z\s\.\']+)\s*\(([\d:]+)\):\s*(.*)$',
        # Pattern 3: [timestamp] Speaker Name: text
        r'^\[?([\d:]+)\]?\s+([A-Z][A-Za-z\s\.\']+):\s*(.*)$',
        # Pattern 4: Speaker Name: text (no timestamp)
        r"^([A-Z][A-Za-z\.'\-]+(?: [A-Z][A-Za-z\.'\-]+)+):\s*(.*)$"
    ]
    
    for line in lines:
        line = line.strip()
        if not line:
            if current_speaker and current_text:
                current_text.append('')
            continue
        
        matched = False
        
        # Try each pattern
        for pattern_idx, pattern in enumerate(patterns):
            match = re.match(pattern, line)
            
            if match:
                # Extract potential speaker based on pattern
                if pattern_idx == 0 or pattern_idx == 1:
                    potential_speaker = match.group(1).strip()
                elif pattern_idx == 2:
                    potential_speaker = match.group(2).strip()
                elif pattern_idx == 3:
                    potential_speaker = match.group(1).strip()
                
                # Validate speaker name
                words = potential_speaker.split()
                non_speaker_prefixes = ['Video', 'Clip', 'Audio', 'Recording', 'Transcript', 'Voice', 'The', 'A', 'An']
                if pattern_idx == 3:
                    # Must have exactly 2 or 3 words (First Middle? Last)
                    if len(words) < 2 or len(words) > 3:
                        continue
                    # Each word must start with capital
                    if not all(w[0].isupper() for w in words):
                        continue
                    # Must not be common non-name phrases
                    if any(potential_speaker.startswith(prefix) for prefix in non_speaker_prefixes):
                        continue
                else:
                    # For patterns with timestamps
                    if (len(words) < 2 or
                        any(potential_speaker.startswith(prefix) for prefix in non_speaker_prefixes) or
                        potential_speaker.isupper()):
                        continue

                # Save previous speaker's text if it exists
                if current_speaker and current_text:
                    text = '\n'.join(current_text).strip()
                    if text:
                        turns.append({
                            'speaker': current_speaker,
                            'timestamp': current_timestamp if current_timestamp else 'N/A',
                            'text': text,
                            'source': source,
                            'date': date 
                        })
                
                # Extract based on which pattern matched
                if pattern_idx == 0 or pattern_idx == 1:
                    current_speaker = match.group(1).strip()
                    current_timestamp = match.group(2).strip()
                    current_text = [match.group(3)] if match.group(3) else []
                elif pattern_idx == 2:
                    current_timestamp = match.group(1).strip()
                    current_speaker = match.group(2).strip()
                    current_text = [match.group(3)] if match.group(3) else []
                elif pattern_idx == 3:
                    current_speaker = match.group(1).strip()
                    current_timestamp = 'N/A'
                    current_text = [match.group(2)] if match.group(2) else []
                
                matched = True
                break
        
        if not matched and current_speaker:
            if not re.match(r'^[A-Z][A-Za-z\s]+:\s*', line):
                current_text.append(line)
    
    # Save last speaker turn
    if current_speaker and current_text:
        text = '\n'.join(current_text).strip()
        if text:
            turns.append({
                'speaker': current_speaker,
                'timestamp': current_timestamp if current_timestamp else 'N/A',
                'text': text,
                'source': source,
                'date': date 
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
            fieldnames = ['speaker', 'timestamp', 'text', 'source', 'date', 'topics']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            # Convert topics list to comma-separated string for CSV
            for row in data:
                row_copy = row.copy()
                topics = row_copy.get('topics', [])
                if topics is None:
                    topics = ['unknown']
                elif not isinstance(topics, list):
                    topics = [str(topics)]
                row_copy['topics'] = ','.join(topics)
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


def preprocess(debate_name, debate_date, input_file_path=None):
    """
    Main preprocessing function.
    
    Args:
        debate_name: Name of the debate (e.g., "2024 CNN Presidential Debate")
        debate_date: Date in YYYY-MM-DD format
        input_file_path: Path to input transcript file (optional, falls back to CLI arg)
    """

    # Get input file from parameter or CLI argument
    if input_file_path:
        input_file = Path(input_file_path)
    elif len(sys.argv) >= 2:
        input_file = Path(sys.argv[1])
    else:
        print("Error: No input file provided!")
        print("Usage: python main.py <input_file.txt>")
        print("Example: python main.py debate_raw.txt")
        sys.exit(1)
    
    # Verify input file exists
    if not input_file.exists():
        error_msg = f"Input file '{input_file}' not found!"
        print(f"Error: {error_msg}")
        raise FileNotFoundError(error_msg)
    
    # Use debate_name from parameter or prompt user
    if debate_name:
        source = debate_name
        print(f"Using debate name: {source}")
    else:
        source = input("\nEnter Debate name/source: ").strip()
        if not source:
            source = "Unknown Debate"
            print(f"No source provided, using: {source}")

    # Use debate_date from parameter or prompt user
    if debate_date:
        date = debate_date
        print(f"Using debate date: {date}")
    else:
        while True:
            date_input = input("Enter Debate date (YYYY-MM-DD, e.g., '2024-06-27'): ").strip()
            
            # If empty, use today's date
            if not date_input:
                date = datetime.now().strftime("%Y-%m-%d")
                print(f"No date provided, using today: {date}")
                break
            
            # Validate date format
            try:
                datetime.strptime(date_input, "%Y-%m-%d")
                date = date_input
                break
            except ValueError:
                print("Invalid format! Please use YYYY-MM-DD (e.g., 2024-06-27)")

    print(f"Reading: {input_file}")
    
    # Read raw transcript
    with open(input_file, 'r', encoding='utf-8') as f:
        raw_text = f.read()
    
    print("\nCleaning transcript...")
    cleaned_text = clean_transcript(raw_text)
    
    print("Extracting speaker turns...")
    speaker_turns = extract_speaker_turns(cleaned_text, source, date)
    
    if not speaker_turns:
        error_msg = "No speaker turns found in transcript!"
        print("\nWarning: No speaker turns found!")
        print("\nExpected formats:")
        print("  - Speaker Name ([timestamp]): text")
        print("  - Speaker Name (timestamp): text")
        print("  - Speaker Name: text")
        print("  - [timestamp] Speaker Name: text")
        print("\nShowing cleaned text sample:")
        print(cleaned_text[:500])
        raise ValueError(error_msg)
    
    print(f"Found {len(speaker_turns)} speaker turns")
    print(f"Source: {source}")
    
    # Classify topics with OpenAI
    print("Classifying topics...")
    texts = [turn['text'] for turn in speaker_turns]
    speakers = [turn['speaker'] for turn in speaker_turns]
    all_topics = classify_topics_batch(texts, speakers)
    
    # Add topics to turns
    none_count = 0
    for turn, topics in zip(speaker_turns, all_topics):
        if topics is None:
            none_count += 1
            topics = ['unknown']  # Default fallback
        turn['topics'] = topics
    
    if none_count > 0:
        print(f"Warning: {none_count} turns had None topics, replaced with 'unknown'")
    
    print(f"Topic classification complete!")
    
    # Generate output filenames
    base_name = input_file.stem  # filename without extension
    output_csv = input_file.parent / f"{base_name}_clean.csv"
    output_json = input_file.parent / f"{base_name}_clean.json"
    
    # Save both formats
    save_as_csv(speaker_turns, output_csv)
    save_as_json(speaker_turns, output_json)
    
    print("\nDone! Preprocessing complete.")
    print(f"\nOutput files:")
    print(f"  - {output_csv}")
    print(f"  - {output_json}\n")
    
    return {
        'csv_path': str(output_csv),
        'json_path': str(output_json),
        'speaker_count': len(speaker_turns),
        'source': source,
        'date': date
    }

if __name__ == "__main__":
    preprocess(None, None)