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
    Improved topic classification with better policy detection
    """
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    if not os.getenv("OPENAI_API_KEY"):
        print("OPENAI_API_KEY not found.")
        return classify_topics_batch_fallback(texts, threshold)
    
    all_topics = [None] * len(texts)
    texts_to_process = []
    speakers_to_process = []
    indices_to_process = []
    
    print("Filtering short turns...")
    for i, (text, speaker) in enumerate(zip(texts, speakers)):
        word_count = len(text.split())
        
        # Improved classification
        if word_count < 5:
            text_lower = text.lower()
            speaker_lower = speaker.lower()
            
            # Better moderator detection
            moderator_phrases = ['welcome', 'next question', 'time is up', 'thank you', 'let me ask', 
                               'your time', 'please respond', 'we\'ll move to', 'final question',
                               'good evening', 'thank you for joining', 'let\'s get started']
            
            if (any(mod_word in speaker_lower for mod_word in ['moderator', 'host', 'anchor', 'david', 'linsey', 'muir', 'davis']) or
                any(phrase in text_lower for phrase in moderator_phrases)):
                all_topics[i] = ["moderator"]
            elif any(response in text_lower for response in ['yes', 'no', 'thank you', 'thanks', 'okay', 'ok']):
                all_topics[i] = ["general_response"]
            else:
                all_topics[i] = ["general_political_commentary"]
        else:
            texts_to_process.append(text)
            speakers_to_process.append(speaker)
            indices_to_process.append(i)
    
    print(f"Sending {len(texts_to_process)}/{len(texts)} substantive turns to OpenAI")
    
    # Process substantive turns
    for i in range(0, len(texts_to_process), 12):  # Smaller batches for better accuracy
        batch_texts = texts_to_process[i:i+12]
        batch_speakers = speakers_to_process[i:i+12]
        batch_indices = indices_to_process[i:i+12]
        
        batch_prompt = "\n\n".join([
            f"Speaker: {speaker}\nText: {text[:400]}"
            for speaker, text in zip(batch_speakers, batch_texts)
        ])
        
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{
                    "role": "system", 
                    "content": """You are a political debate analyst. Analyze each speaker turn and return the most specific topics.
                        CRITICAL RULES:
                        1. If the speaker is clearly a MODERATOR (asking questions, managing debate, procedural comments), return ["moderator"]
                        2. For CANDIDATES, analyze the actual policy content, not just election rhetoric
                        3. Use SPECIFIC policy topics, not "elections" unless it's purely about voting/electoral process
                        4. Prioritize: economy, taxes, healthcare, immigration, foreign_policy, abortion, guns, crime, climate, education, social_security, military
                        5. Only use "elections" when discussing voting, campaigns, or electoral outcomes specifically
                        6. Use "general_politics" only for very general statements without policy substance

                        Examples:
                        - "I'll cut taxes for middle class" → ["economy", "taxes"] 
                        - "We need border security" → ["immigration"]
                        - "Roe v Wade was wrong" → ["abortion"]
                        - "My plan creates jobs" → ["economy", "jobs"]
                        - "The election was stolen" → ["elections"]

                        Return JSON: {"results": [["topic1", "topic2"], ...]}"""
                }, {
                    "role": "user",
                    "content": f"Analyze these {len(batch_texts)} speaker turns. Focus on POLICY content:\n\n{batch_prompt}"
                }],
                temperature=0.1,
                max_tokens=800,
                response_format={"type": "json_object"}
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            batch_topics = result["results"]
            
            # Validate results
            if len(batch_topics) != len(batch_texts):
                print(f"OpenAI returned {len(batch_topics)} results but expected {len(batch_texts)}")
                batch_topics = batch_topics + [["general_politics"] for _ in range(len(batch_texts) - len(batch_topics))]
            
            # Map back to original indices
            for j, topics in enumerate(batch_topics):
                original_idx = batch_indices[j]
                if not topics or not isinstance(topics, list):
                    topics = ["general_politics"]
                all_topics[original_idx] = topics
                
        except Exception as e:
            print(f"OpenAI classification failed: {e}")
            fallback_topics = classify_topics_batch_fallback(batch_texts, threshold)
            for j, topics in enumerate(fallback_topics):
                original_idx = batch_indices[j]
                all_topics[original_idx] = topics
    
    # Final safety check
    for i in range(len(all_topics)):
        if all_topics[i] is None or not isinstance(all_topics[i], list):
            all_topics[i] = ["general_politics"]
    
    return all_topics

def classify_topics_batch(texts, speakers, threshold=0.3):
    """
    Topic classification with 2-3 tags per turn, except moderators get 1 tag
    """
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    if not os.getenv("OPENAI_API_KEY"):
        print("OPENAI_API_KEY not found. Using fallback classifier.")
        return classify_topics_batch_fallback(texts, threshold)
    
    all_topics = [None] * len(texts)
    texts_to_process = []
    speakers_to_process = []
    indices_to_process = []
    
    print("🔍 Filtering short turns...")
    for i, (text, speaker) in enumerate(zip(texts, speakers)):
        word_count = len(text.split())
        
        # Classification
        if word_count < 10:
            text_lower = text.lower()
            speaker_lower = speaker.lower()
            
            # Comprehensive moderator detection
            moderator_names = ['david', 'muir', 'linsey', 'davis', 'moderator', 'host', 'anchor']
            moderator_phrases = [
                'welcome', 'next question', 'time is up', 'thank you', 'let me ask', 
                'your time', 'please respond', 'we\'ll move to', 'final question',
                'good evening', 'thank you for joining', 'let\'s get started',
                'i want to turn to', 'i want to ask', 'your response', 'we\'ll give you',
                'madam vice president', 'mr. president', 'president trump', 'vice president harris',
                'rules of tonight\'s debate', 'ninety minutes', 'microphones', 'no pre-written notes',
                'no audience', 'coin toss', 'closing statement', 'podium', 'welcome to the stage'
            ]
            
            # Check for incomplete sentences
            is_moderator_turn = (
                any(name in speaker_lower for name in moderator_names) or
                any(phrase in text_lower for phrase in moderator_phrases) or
                # Detect incomplete moderator sentences
                ('rules' in text_lower and 'debate' in text_lower) or
                ('minutes' in text_lower and any(word in text_lower for word in ['with', 'debate', 'two'])) or
                ('microphones' in text_lower) or
                ('audience' in text_lower and 'no' in text_lower) or
                ('closing statement' in text_lower) or
                ('podium' in text_lower)
            )
            
            if is_moderator_turn:
                all_topics[i] = ["moderator"]
            elif any(response in text_lower for response in ['yes', 'no', 'thank you', 'thanks', 'okay', 'ok', 'come on', 'that\'s not true']):
                all_topics[i] = ["general_response", "brief_comment"]
            else:
                all_topics[i] = ["general_political_commentary", "brief_statement"]
        else:
            texts_to_process.append(text)
            speakers_to_process.append(speaker)
            indices_to_process.append(i)
    
    print(f"Sending {len(texts_to_process)}/{len(texts)} substantive turns to OpenAI")
    
    # Process substantive turns
    for i in range(0, len(texts_to_process), 10):
        batch_texts = texts_to_process[i:i+10]
        batch_speakers = speakers_to_process[i:i+10]
        batch_indices = indices_to_process[i:i+10]
        
        # Prepare batch
        batch_prompt_entries = []
        for speaker, text in zip(batch_speakers, batch_texts):
            truncated_text = text[:600]
            
            sentence_endings = ['. ', '? ', '! ', '; ', ', ', ' ']
            for ending in sentence_endings:
                last_ending = truncated_text.rfind(ending)
                if last_ending > 400:
                    truncated_text = truncated_text[:last_ending + len(ending)].strip()
                    break
            
            # Add ellipsis if we truncated
            if len(truncated_text) < len(text):
                truncated_text += "..."
                
            batch_prompt_entries.append(f"Speaker: {speaker}\nText: {truncated_text}")
        
        batch_prompt = "\n\n".join(batch_prompt_entries)
        
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[{
                    "role": "system", 
                    "content": """You are a political debate analyst. Analyze each speaker turn and return topics in JSON format.
                        CRITICAL RULES:
                        1. MODERATOR TURNS: If speaker is David Muir, Linsey Davis, or anyone asking questions/managing debate → RETURN EXACTLY ["moderator"] (1 tag only)
                        2. CANDIDATE TURNS: Return 2-3 specific policy topics from this list:
                        - Primary topics: economy, taxes, immigration, foreign_policy, abortion, healthcare, guns, crime, climate, energy, education, social_security, military
                        - Secondary topics: jobs, housing, inflation, trade, civil_rights, election_integrity, national_security
                        - General fallbacks: general_politics, policy_discussion
                        3. TAG COUNT REQUIREMENTS:
                        - Moderators: ALWAYS ["moderator"] (1 tag only)
                        - Candidates: ALWAYS 2-3 tags (never 1, never more than 3)
                        - If you can't find 2 specific topics, use "general_politics" as second tag

                        SPECIAL NOTE: Some texts may be cut off mid-sentence. Use the available context to determine the topic.

                        Return ONLY valid JSON in this exact format:
                        {"results": [["topic1", "topic2"], ["moderator"], ["topic1", "topic2", "topic3"], ...]}"""
                }, {
                    "role": "user",
                    "content": f"Analyze these {len(batch_texts)} turns. Follow tag count rules STRICTLY. Return ONLY JSON:\n\n{batch_prompt}"
                }],
                temperature=0.1,
                max_tokens=1000
            )
            
            import json
            import re
            
            # Extract JSON from response
            response_text = response.choices[0].message.content
            
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                result = json.loads(json_str)
                batch_topics = result["results"]
            else:
                # If no JSON found, try to parse the entire response as JSON
                try:
                    result = json.loads(response_text)
                    batch_topics = result["results"]
                except:
                    print(f"Could not parse JSON from response: {response_text[:200]}...")
                    raise ValueError("Invalid JSON response from OpenAI")
            
            validated_topics = []
            for j, topics in enumerate(batch_topics):
                if not topics or not isinstance(topics, list):
                    topics = ["general_politics", "policy_discussion"]
                
                speaker = batch_speakers[j]
                text = batch_texts[j]
                text_lower = text.lower()
                
                # Moderator detection
                is_moderator = (
                    any(name in speaker.lower() for name in ['david', 'muir', 'linsey', 'davis', 'moderator']) or
                    any(phrase in text_lower for phrase in [
                        'next question', 'your response', 'we\'ll give you', 
                        'madam vice president', 'mr. president', 'rules of tonight',
                        'ninety minutes', 'microphones', 'no pre-written notes',
                        'no audience', 'coin toss', 'closing statement', 'podium',
                        'welcome to the stage', 'let\'s now welcome'
                    ]) or
                    # Detect incomplete moderator patterns
                    ('rules' in text_lower and any(word in text_lower for word in ['debate', 'tonight'])) or
                    ('minutes' in text_lower and 'with' in text_lower) or
                    ('microphones' in text_lower and 'turned on' in text_lower) or
                    ('audience' in text_lower and 'no' in text_lower)
                )
                
                if is_moderator:
                    validated_topics.append(["moderator"])
                else:
                    # Candidates get 2-3 tags
                    if len(topics) == 1:
                        topics.append("general_politics")
                    elif len(topics) > 3:
                        topics = topics[:3]
                    if len(topics) < 2:
                        topics.extend(["general_politics", "policy_discussion"][:2-len(topics)])
                    validated_topics.append(topics)
            
            if len(validated_topics) != len(batch_texts):
                print(f"OpenAI returned {len(validated_topics)} results but expected {len(batch_texts)}")
                validated_topics = validated_topics + [["general_politics", "policy_discussion"] for _ in range(len(batch_texts) - len(validated_topics))]
            
            for j, topics in enumerate(validated_topics):
                original_idx = batch_indices[j]
                all_topics[original_idx] = topics
                
        except Exception as e:
            print(f"OpenAI classification failed: {e}")
            # Fallback
            fallback_topics = classify_topics_batch_fallback(batch_texts, threshold)
            validated_fallback = []
            for j, topics in enumerate(fallback_topics):
                speaker = batch_speakers[j]
                text = batch_texts[j]
                text_lower = text.lower()
                
                is_moderator = (
                    any(name in speaker.lower() for name in ['david', 'muir', 'linsey', 'davis', 'moderator']) or
                    any(phrase in text_lower for phrase in [
                        'next question', 'your response', 'we\'ll give you', 
                        'rules of tonight', 'ninety minutes', 'microphones'
                    ])
                )
                
                if is_moderator:
                    validated_fallback.append(["moderator"])
                else:
                    if len(topics) == 1:
                        topics.append("general_politics")
                    elif len(topics) > 3:
                        topics = topics[:3]
                    if len(topics) < 2:
                        topics.extend(["general_politics", "policy_discussion"][:2-len(topics)])
                    validated_fallback.append(topics)
            
            for j, topics in enumerate(validated_fallback):
                original_idx = batch_indices[j]
                all_topics[original_idx] = topics
    
    # Final validation pass
    for i in range(len(all_topics)):
        if all_topics[i] is None:
            all_topics[i] = ["general_politics", "policy_discussion"]
        else:
            speaker = speakers[i] if i < len(speakers) else ""
            text = texts[i] if i < len(texts) else ""
            text_lower = text.lower()
            
            # Final moderator check for incomplete texts
            is_moderator = (
                any(name in speaker.lower() for name in ['david', 'muir', 'linsey', 'davis', 'moderator']) or
                any(phrase in text_lower for phrase in [
                    'next question', 'your response', 'we\'ll give you', 
                    'rules of tonight', 'ninety minutes', 'microphones',
                    'no pre-written notes', 'no audience', 'coin toss'
                ]) or
                ('rules' in text_lower and 'debate' in text_lower) or
                ('minutes' in text_lower and 'with' in text_lower)
            )
            
            if is_moderator:
                all_topics[i] = ["moderator"]
            else:
                if len(all_topics[i]) == 1:
                    all_topics[i].append("general_politics")
                elif len(all_topics[i]) > 3:
                    all_topics[i] = all_topics[i][:3]
    
    return all_topics

def classify_topics_batch_fallback(texts, threshold=0.3):
    """
    Fallback classifier using the original BART model
    """
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
        "policy discussion",
        "moderator"
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
                
                final_topics = topics[:3] if topics else ["policy_discussion"]
                all_topics.append(final_topics)
                
                # Save to cache
                save_cached_topics(text, final_topics)
                cache_misses += 1                
    except Exception as e:
        print(f"⚠️  Fallback classification failed: {e}")
        all_topics = [["policy_discussion"] for _ in texts]
    
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
        r'^([A-Za-z\s\.\']+)\s*\(\[?([\d:]+)\]?\):\s*(.*)$',
        # Pattern 2: Speaker Name (timestamp): text (no brackets)
        r'^([A-Za-z\s\.\']+)\s*\(([\d:]+)\):\s*(.*)$',
        # Pattern 3: [timestamp] Speaker Name: text
        r'^\[?([\d:]+)\]?\s+([A-Za-z\s\.\']+):\s*(.*)$',
        # Pattern 4: Speaker Name: text (no timestamp)
        r"^([A-Z][A-Za-z\.'\-]+(?: [A-Z][A-Za-z\.'\-']+)*):\s*(.*)$"
    ]
    
    for line in lines:
        line = line.strip()
        if not line:
            # If we have a current speaker, add blank line to preserve paragraph breaks
            if current_speaker and current_text:
                current_text.append('')
            continue
        
        matched = False
        
        # Try each pattern
        for pattern_idx, pattern in enumerate(patterns):
            match = re.match(pattern, line)
            
            if match:
                # Based on pattern
                if pattern_idx == 0 or pattern_idx == 1:
                    potential_speaker = match.group(1).strip()
                elif pattern_idx == 2:
                    potential_speaker = match.group(2).strip()
                elif pattern_idx == 3:
                    potential_speaker = match.group(1).strip()
                
                # First and Last name validation
                words = potential_speaker.split()
                non_speaker_prefixes = ['Video', 'Clip', 'Audio', 'Recording', 'Transcript', 'Voice']
                
                if (len(words) < 2 or # Must have at least 2 words
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
                    # FIX: Always capture the text part, even if empty
                    text_content = match.group(3) if match.group(3) else ""
                    current_text = [text_content] if text_content else []
                elif pattern_idx == 2:
                    current_timestamp = match.group(1).strip()
                    current_speaker = match.group(2).strip()
                    text_content = match.group(3) if match.group(3) else ""
                    current_text = [text_content] if text_content else []
                elif pattern_idx == 3:
                    current_speaker = match.group(1).strip()
                    current_timestamp = 'N/A'
                    text_content = match.group(2) if match.group(2) else ""
                    current_text = [text_content] if text_content else []
                
                matched = True
                break
        
        # FIX: Better handling of continuation lines
        if not matched and current_speaker:
            # This line doesn't match any speaker pattern, so it's a continuation
            # of the current speaker's text
            if current_text:
                # If we have existing text, append this line
                current_text.append(line)
            else:
                # If no text yet, start with this line
                current_text = [line]
    
    # Last speaker turn
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
    
    # Add topics to turns with safety check
    none_count = 0
    for turn, topics in zip(speaker_turns, all_topics):
        if topics is None:
            none_count += 1
            topics = ['unknown']
        elif not isinstance(topics, list):
            topics = [str(topics)]
        turn['topics'] = topics
    
    if none_count > 0:
        print(f"Warning: {none_count} turns had None topics")
    
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