import re
from typing import List
from difflib import SequenceMatcher

# Extract meaningful words, removing stop words.
def extract_key_terms(text: str) -> List[str]:
    stop_words = {
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
        'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'in', 'of', 'to', 'for', 'with', 'by', 'from', 'that', 'this'
    }
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    return [w for w in words if w not in stop_words and len(w) > 2]


# Extract all numbers from text.
def extract_numbers(text: str) -> List[float]:
    return [float(n) for n in re.findall(r'\b\d+(?:\.\d+)?\b', text)]


# Calculate similarity emphasizing key term overlap.
def enhanced_similarity(claim: str, text: str) -> float:
    base_sim = SequenceMatcher(None, claim.lower(), text.lower()).ratio()
    claim_terms = set(extract_key_terms(claim))
    text_terms = set(extract_key_terms(text))
    
    if not claim_terms:
        return base_sim
    
    term_overlap = len(claim_terms & text_terms) / len(claim_terms)
    return 0.4 * base_sim + 0.6 * term_overlap

# Helper to pick the sentence most relevant to the claim
def number_matches_with_context(claim: str, snippet: str) -> bool:
    claim_nums = extract_numbers(claim)
    snippet_nums = extract_numbers(snippet)
    snippet_lower = snippet.lower()
    
    claim_terms = extract_key_terms(claim)
    entity_terms = [t for t in claim_terms if t.lower() not in {"the", "of", "and", "is", "are", "a", "an"}]
    
    for cn in claim_nums:
        for sn in snippet_nums:
            if cn > 0 and abs(cn - sn) / max(cn, sn) <= 0.05:
                for term in entity_terms:
                    pattern = rf'\b{sn}\b(?:\W+\w+){{0,5}}\W+\b{term}\b'
                    if re.search(pattern, snippet_lower):
                        return True
    return False

# Check if a snippet is relevant to the claim.
def is_snippet_relevant(claim: str, snippet: str) -> bool:
    claim_terms = set(extract_key_terms(claim))
    snippet_terms = set(extract_key_terms(snippet))
    
    if len(claim_terms & snippet_terms) < 1:
        return False
    
    claim_nums = extract_numbers(claim)
    if claim_nums and not number_matches_with_context(claim, snippet):
        return False
    
    return True

# Extract the most relevant snippets from text for a given claim.
def get_most_relevant_snippets(claim: str, text: str, classifier=None, top_n: int = 3) -> List[str]:
    if not text:
        return []
    
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if not sentences:
        return [text[:200]]
    
    candidate_sentences = [s for s in sentences if is_snippet_relevant(claim, s)]
    if not candidate_sentences:
        candidate_sentences = sentences
    
    top_candidates = sorted(candidate_sentences, key = lambda s: enhanced_similarity(claim, s), reverse = True)[:top_n]
    
    if classifier:
        from classifier import classify_snippet
        top_candidates.sort(key = lambda s: classify_snippet(s, claim, classifier)["score"], reverse = True)
    
    return top_candidates