import os
import json
import requests
import argparse
import re
from typing import List, Dict, Any, Optional

# Simple fallback similarity
from difflib import SequenceMatcher

# Transformer zero-shot classifier
try:
    from transformers import pipeline
    ZERO_SHOT_AVAILABLE = True
except Exception:
    ZERO_SHOT_AVAILABLE = False

# Additional NewsAPI client
try:
    from newsapi import NewsApiClient
    NEWSAPI_AVAILABLE = True
except Exception:
    NEWSAPI_AVAILABLE = False

# Configuration
WIKI_API_URL = "https://en.wikipedia.org/w/api.php"
ZERO_SHOT_MODEL = "facebook/bart-large-mnli"
NEWSAPI_ENV_VAR = "NEWSAPI_KEY"
HEADERS = {"User-Agent": "DebateMatch/1.0 (pavanarani00@gmail.com)" }

# Wikipedia helper function
# Search Wikipedia and return list of candidate pages with title and snippet (extract).
def wiki_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    
    parameters = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": limit,
        "format": "json",
        "srprop": "snippet"
    }

    response = requests.get(WIKI_API_URL, params = parameters, headers = HEADERS, timeout = 10)
    response.raise_for_status()
    data = response.json()
    results = []

    for entry in data.get("query", {}).get("search", []):
        title = entry.get("title")
        results.append({
            "source": "wikipedia",
            "title": title,
            "snippet": entry.get("snippet", ""),
            "extract": wiki_get_extract(title),
            "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
        })

    return results

# Wikipedia helper function
# Get the introductory extract text from a Wikipedia page by title.
def wiki_get_extract(title: str) -> str:

    parameters = {
        "action": "query",
        "prop": "extracts",
        "exintro": True,
        "explaintext": True,
        "titles": title,
        "format": "json",
        "redirects": 1
    }
    response = requests.get(WIKI_API_URL, params = parameters, headers = HEADERS, timeout = 10)
    response.raise_for_status()
    pages = response.json().get("query", {}).get("pages", {})

    for _, page in pages.items():
        return page.get("extract", "")
    
    return ""

# Text Analysis Helper
# Extract meaningful words, removing stop words.
def extract_key_terms(text: str) -> List[str]:
    
    stop_words = {
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
        'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'in', 'of', 'to', 'for', 'with', 'by', 'from', 'that', 'this'
    }

    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    return [w for w in words if w not in stop_words and len(w) > 2]

# Text Analysis Helper
# Extract all numbers from text.
def extract_numbers(text: str) -> List[float]:
    return [float(n) for n in re.findall(r'\b\d+(?:\.\d+)?\b', text)]

# Text Analysis Helper
# Calculate similarity emphasizing key term overlap.
def enhanced_similarity(claim: str, text: str) -> float:
    
    base_sim = SequenceMatcher(None, claim.lower(), text.lower()).ratio()
    claim_terms = set(extract_key_terms(claim))
    text_terms = set(extract_key_terms(text))

    if not claim_terms:
        return base_sim
    
    term_overlap = len(claim_terms & text_terms) / len(claim_terms)
    return 0.4 * base_sim + 0.6 * term_overlap

# Smart Contradiction Detection
# Detect if numbers in claim contradict those in text.
def check_numerical_contradiction(claim: str, text: str) -> bool:

    claim_nums = extract_numbers(claim)
    text_nums = extract_numbers(text)
    
    if not claim_nums or not text_nums:
        return False
    
    # Check if contexts are related
    claim_terms = set(extract_key_terms(claim))
    text_terms = set(extract_key_terms(text))
    if len(claim_terms & text_terms) < 2:
        return False
    
    # Check for matching numbers (5% tolerance)
    for cn in claim_nums:
        for tn in text_nums:
            if cn > 0 and tn > 0:
                if abs(cn - tn) / max(cn, tn) <= 0.05:
                    return False  # Numbers match, no contradiction
    
    # Check for significantly different numbers (>10% difference)
    for cn in claim_nums:
        for tn in text_nums:
            if cn > 0 and tn > 0:
                if abs(cn - tn) / max(cn, tn) > 0.1:
                    return True
    
    return False

# Smart Contradiction Detection
# Detect contradictions in categorical claims like 'X is Y'.
def check_categorical_contradiction(claim: str, text: str) -> bool:

    # Parse "X is/are Y" pattern
    match = re.search(r'^(.+?)\s+(is|are)\s+(.+)$', claim.lower().strip())
    if not match:
        return False
    
    subject = match.group(1).strip()
    predicate = match.group(3).strip()
    text_lower = text.lower()
    
    # Check if text is debunking the predicate concept
    debunk_words = ['disproven', 'false', 'myth', 'misconception', 'archaic', 'incorrect', 'untrue', 'debunk']
    predicate_debunked = any(
        re.search(rf'{re.escape(predicate)}.{{0,50}}{debunk}', text_lower) or
        re.search(rf'{debunk}.{{0,50}}{re.escape(predicate)}', text_lower)
        for debunk in debunk_words
    )
    
    if predicate_debunked:
        return True
    
    # General contradictions: "X is not Y"
    patterns = [
        f"{re.escape(subject)}.*?(?:is|are).*?(?:not|n't).*?{re.escape(predicate)}",
    ]
    
    return any(re.search(p, text_lower) for p in patterns)

# News helper    
# Search news using NewsAPI. Requires NEWSAPI_KEY in env or passed explicitly.
# Returns top articles with title + description + url.
def news_search(query: str, limit: int = 3, api_key: Optional[str] = None) -> List[Dict[str, Any]]:

    if not NEWSAPI_AVAILABLE or not api_key:
        return []
    
    client = NewsApiClient(api_key = api_key)
    try:
        result = client.get_everything(q = query, language = 'en', page_size = limit, sort_by = 'relevancy')
    except Exception:
        return []
    
    articles = result.get("articles", [])[:limit]
    output = []

    for article in articles:
        output.append({
            "source": article.get("source", {}).get("name", "news"),
            "title": article.get("title"),
            "snippet": article.get("description") or "",
            "url": article.get("url")
        })

    return output

# Classifier helper
# Return a zero-shot pipeline instance if available, else None.
def safe_zero_shot_classifier():

    if not ZERO_SHOT_AVAILABLE:
        return None
    try:
        return pipeline("zero-shot-classification", model = ZERO_SHOT_MODEL)
    except Exception:
        return None

# Classifier helper
# Classify whether snippet supports/refutes/has insufficient evidence for claim.
def classify_snippet(snippet: str, claim: str, zero_shot_classifier = None) -> Dict[str, Any]:
    
    # Priority 1: Check for categorical contradictions
    if check_categorical_contradiction(claim, snippet):
        return {"label": "refutes", "score": 0.90}
    
    # Priority 2: Check for numerical contradictions
    if check_numerical_contradiction(claim, snippet):
        return {"label": "refutes", "score": 0.85}
    
    # Priority 3: Use zero-shot classifier if available
    if zero_shot_classifier:
        try:
            # Use first 500 chars for efficiency
            text = snippet[:500]
            result = zero_shot_classifier(
                text,
                ["supports the claim", "refutes the claim", "no evidence"],
                multi_label = False
            )
            
            label_map = {
                "supports the claim": "supports",
                "refutes the claim": "refutes",
                "no evidence": "not enough evidence"
            }
            
            top_label = result["labels"][0]
            score = float(result["scores"][0])
            second_score = float(result["scores"][1]) if len(result["scores"]) > 1 else 0.0
            confidence_margin = score - second_score
            
            mapped_label = label_map.get(top_label, "not enough evidence")
            
            # If confidence is low, default to not enough evidence
            if score < 0.5 or confidence_margin < 0.2:
                return {"label": "not enough evidence", "score": score * 0.6}
            
            # Additional validation: check if the classification makes sense with similarity
            similarity = enhanced_similarity(claim, text)
            
            # If classifier says "supports" but similarity is very low, be skeptical
            if mapped_label == "supports" and similarity < 0.3:
                return {"label": "not enough evidence", "score": similarity}
            
            # If classifier says "refutes" but there's no clear negation, be skeptical
            if mapped_label == "refutes":
                negation_indicators = ['not', 'no', 'never', 'false', 'incorrect', 'deny', 'myth', 'disproven']
                has_negation = any(word in text.lower() for word in negation_indicators)
                if not has_negation and similarity < 0.4:
                    return {"label": "not enough evidence", "score": similarity}
            
            return {"label": mapped_label, "score": score}
        except Exception:
            pass
    
    # Fallback: Rule-based classification
    similarity = enhanced_similarity(claim, snippet)
    text_lower = snippet.lower()
    
    negation_words = ['not', 'no', 'never', 'false', 'incorrect', 'deny', 'myth', 'disproven']
    has_negation = any(word in text_lower for word in negation_words)
    
    if similarity > 0.4:
        if has_negation:
            return {"label": "refutes", "score": similarity}
        else:
            return {"label": "supports", "score": similarity}
    
    return {"label": "not enough evidence", "score": similarity}

# Classifier helper
# Aggregate multiple snippet judgments into a final verdict and confidence.
def aggregate_judgments(judgments: List[Dict[str, Any]]) -> Dict[str, Any]:
    
    if not judgments:
        return {
            "verdict": "NOT ENOUGH EVIDENCE",
            "confidence": 0.0,
            "counts": {"supports": 0, "refutes": 0, "not enough evidence": 0}
        }
    
    counts = {"supports": 0, "refutes": 0, "not enough evidence": 0}
    scores = {"supports": [], "refutes": [], "not enough evidence": []}
    
    for j in judgments:
        label = j.get("label", "not enough evidence")
        counts[label] += 1
        scores[label].append(j.get("score", 0.0))
    
    total = len(judgments)
    
    # Refutations require less evidence
    if counts["refutes"] >= 1 and counts["refutes"] / total >= 0.3:
        majority = "refutes"
    elif counts["supports"] >= 2 and counts["supports"] / total > 0.5:
        majority = "supports"
    else:
        majority = "not enough evidence"
    
    avg_score = sum(scores[majority]) / len(scores[majority]) if scores[majority] else 0.0
    
    verdict_map = {
        "supports": "SUPPORTED",
        "refutes": "REFUTED",
        "not enough evidence": "NOT ENOUGH EVIDENCE"
    }
    
    return {
        "verdict": verdict_map[majority],
        "confidence": float(avg_score),
        "counts": counts
    }

# Main entry for verdicts
# Evaluates a claim using Wikipedia and news sources.
def claim_verdict(claim: str, top_k: int = 5, use_news: bool = True) -> Dict[str, Any]:

    if not claim or not claim.strip():
        raise ValueError("Claim must be non-empty")
    
    wiki_results = wiki_search(claim, limit = top_k)
    news_results = []
    news_api_key = os.environ.get("NEWSAPI_KEY")

    if use_news and news_api_key:
        news_results = news_search(claim, limit = top_k, api_key = news_api_key)

    if not wiki_results:
        return {
            "claim": claim,
            "verdict": "NOT ENOUGH EVIDENCE",
            "confidence": 0.0,
            "sources": [],
            "per_source": []
        }
    
    classifier = safe_zero_shot_classifier()
    per_source = []
    
    for entry in wiki_results:
        text = entry.get("extract") or entry.get("snippet") or ""
        if not text:
            continue
        
        judgment = classify_snippet(text, claim, classifier)
        per_source.append({
            "source": "wikipedia",
            "title": entry.get("title"),
            "url": entry.get("url"),
            "snippet": text,
            "label": judgment["label"],
            "score": judgment["score"]
        })

    for news_entry in news_results:
        text = (news_entry.get("snippet") or "") + " " + (news_entry.get("title") or "")
        judgment = classify_snippet(text, claim, classifier)
        per_source.append({
            "source": news_entry.get("source"),
            "title": news_entry.get("title"),
            "url": news_entry.get("url"),
            "snippet": text,
            "label": judgment["label"],
            "score": judgment["score"]
        })
    
    result = aggregate_judgments(per_source)
    
    return {
        "claim": claim,
        "verdict": result["verdict"],
        "confidence": result["confidence"],
        "sources": wiki_results,
        "per_source": per_source,
        "badge_html": make_badge_html(result["verdict"], result["confidence"])
    }

# Generate a simple colored badge for verdict and confidence.
def make_badge_html(verdict: str, confidence: float) -> str:

    confidence_percent = int(round(confidence * 100))
    color_map = {
        "SUPPORTED": "#00ff6a",
        "REFUTED": "#ff1900",
        "NOT ENOUGH EVIDENCE": "#ffcc00"
    }

    color = color_map.get(verdict, "#494949")

# CLI, Command-line interface for testing fact-checker.
def run_cli():
    parser = argparse.ArgumentParser(description = "Fact-checker for Debate Match")
    parser.add_argument("claim", type = str, help = "Claim to fact-check")
    parser.add_argument("--top", type = int, default = 5, help = "Top K results")
    parser.add_argument("--no-news", action = "store_true", help = "Skip NewsAPI search.")
    parser.add_argument("--raw", action = "store_true", help = "Print raw JSON")
    args = parser.parse_args()
    
    result = claim_verdict(args.claim, top_k = args.top, use_news = (not args.no_news))
    
    if args.raw:
        print(json.dumps(result, indent = 2))
    else:
        print("Claim:", result["claim"])
        print("Verdict:", result["verdict"], f"(confidence {result['confidence']:.2f})")
        print("Badge:", result["badge_html"])
        print("\nPer-source evidence:")
        for entry in result["per_source"]:
            print(f"- [{entry['source']}] {entry.get('title')} -> {entry['label']} ({entry['score']:.2f})")
            if entry.get("url"):
                 print("  URL:", entry["url"])
            snippet_preview = (entry.get("snippet") or "")[:200]
            if snippet_preview:
                print("  Snippet:", snippet_preview.replace("\n", " "))

run_cli()