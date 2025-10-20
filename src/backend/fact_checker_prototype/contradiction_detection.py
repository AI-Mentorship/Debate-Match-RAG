import re
from typing import List
from .text_utils import extract_numbers, extract_key_terms

# Detect if numbers in claim contradict those in text.
def check_numerical_contradiction(claim: str, text: str) -> bool:
    claim_nums = extract_numbers(claim)
    text_nums = extract_numbers(text)
    
    if not claim_nums or not text_nums:
        return False
    
    claim_terms = set(extract_key_terms(claim))
    text_terms = set(extract_key_terms(text))
    if len(claim_terms & text_terms) < 2:
        return False
    
    # Check for matching numbers (5% tolerance)
    for cn in claim_nums:
        for tn in text_nums:
            if cn > 0 and tn > 0:
                if abs(cn - tn) / max(cn, tn) <= 0.05:
                    return False
    
    # Check for significantly different numbers (>10% difference)
    for cn in claim_nums:
        for tn in text_nums:
            if cn > 0 and tn > 0:
                if abs(cn - tn) / max(cn, tn) > 0.1:
                    return True
    
    return False

# Detect contradictions in categorical claims like 'X is Y'.
def check_categorical_contradiction(claim: str, text: str) -> bool:
    match = re.search(r'^(.+?)\s+(is|are)\s+(.+)$', claim.lower().strip())
    if not match:
        return False
    
    subject = match.group(1).strip()
    predicate = match.group(3).strip()
    text_lower = text.lower()
    
    debunk_words = ['disproven', 'false', 'myth', 'misconception', 'archaic', 'incorrect', 'untrue', 'debunk']
    predicate_debunked = any(
        re.search(rf'{re.escape(predicate)}.{{0,50}}{debunk}', text_lower) or
        re.search(rf'{debunk}.{{0,50}}{re.escape(predicate)}', text_lower)
        for debunk in debunk_words
    )
    
    if predicate_debunked:
        return True
    
    patterns = [
        f"{re.escape(subject)}.*?(?:is|are).*?(?:not|n't).*?{re.escape(predicate)}",
    ]
    
    return any(re.search(p, text_lower) for p in patterns)