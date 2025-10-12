import os
import json
import requests
import argparse
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

HEADERS = {
    "User-Agent": "DebateMatch/1.0 (pavanarani00@gmail.com)" 
}

# Wikipedia helper function
# Search Wikipedia and return list of candidate pages with title and snippet (extract).
def wiki_search(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    
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

    for search_entry in data.get("query", {}).get("search", []):
        title = search_entry.get("title")
        snippet = search_entry.get("snippet", "")
        extract = wiki_get_extract(title)
        results.append({
            "source": "wikipedia",
            "title": title,
            "snippet": snippet,
            "extract": extract,
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

    if zero_shot_classifier:
        candidate_labels = [
            "supports the claim",
            "refutes the claim",
            "provides no evidence about the claim"
        ]

        try:
            result = zero_shot_classifier(snippet, candidate_labels, multi_label = False)
            label_map = {
                "supports the claim": "supports",
                "refutes the claim": "refutes",
                "provides no evidence about the claim": "not enough evidence"
            }
            top_label = result["labels"][0]
            score = float(result["scores"][0])
            mapped_label = label_map.get(top_label, "not enough evidence")
            return {"label": mapped_label, "score": score}
        except Exception:
            pass

    similarity = SequenceMatcher(None, claim.lower(), snippet.lower()).ratio()
    contradiction_markers = ["not", "no", "never", "false", "untrue"]
    support_markers = ["is", "are", "states", "reports", "says"]
    lower_text = snippet.lower()
    has_contradiction = any(marker in lower_text for marker in contradiction_markers)
    has_support = any(marker in lower_text for marker in support_markers)

    if similarity > 0.45 and has_support and not has_contradiction:
        return {"label": "supports", "score": similarity}
    
    if similarity > 0.45 and has_contradiction:
        return {"label": "refutes", "score": similarity}
    
    return {"label": "not enough evidence", "score": similarity}

# Classifier helper
# Aggregate multiple snippet judgments into a final verdict and confidence.
def aggregate_judgments(judgments: List[Dict[str, Any]]) -> Dict[str, Any]:

    counts = {"supports": 0, "refutes": 0, "not enough evidence": 0}
    scores = {"supports": [], "refutes": [], "not enough evidence": []}

    for judgment in judgments:
        label = judgment.get("label", "not enough evidence")
        counts[label] += 1
        scores[label].append(judgment.get("score", 0.0))

    majority_label = max(counts.items(), key = lambda item: item[1])[0]
    average_score = sum(scores[majority_label]) / len(scores[majority_label]) if scores[majority_label] else 0.0
    verdict_map = {
        "supports": "SUPPORTED",
        "refutes": "REFUTED",
        "not enough evidence": "NOT ENOUGH EVIDENCE"
    }

    return {
        "verdict": verdict_map.get(majority_label, "NOT ENOUGH EVIDENCE"),
        "confidence": float(average_score),
        "counts": counts
    }

# Main entry for verdicts
# Evaluates a claim using Wikipedia and news sources.
def claim_verdict(claim: str, top_k: int = 3, use_news: bool = True) -> Dict[str, Any]:

    if not claim or not claim.strip():
        raise ValueError("Claim must be non-empty")

    wiki_results = wiki_search(claim, limit = top_k)
    news_results = []
    news_api_key = os.environ.get("NEWSAPI_KEY")
    
    if use_news and news_api_key:
        news_results = news_search(claim, limit = top_k, api_key = news_api_key)

    all_sources = []

    for wiki_entry in wiki_results:
        text = wiki_entry.get("extract") or wiki_entry.get("snippet") or ""
        all_sources.append({
            "source": "wikipedia",
            "title": wiki_entry.get("title"),
            "text": text,
            "url": wiki_entry.get("url")
        })

    for news_entry in news_results:
        text = (news_entry.get("snippet") or "") + " " + (news_entry.get("title") or "")
        all_sources.append({
            "source": news_entry.get("source"),
            "title": news_entry.get("title"),
            "text": text,
            "url": news_entry.get("url")
        })

    if not all_sources:
        return {
            "claim": claim,
            "verdict": "NOT ENOUGH EVIDENCE",
            "confidence": 0.0,
            "sources": [],
            "per_source": [],
            "badge_html": make_badge_html("NOT ENOUGH EVIDENCE", 0.0)
        }

    zero_shot_classifier = safe_zero_shot_classifier()
    per_source = []

    for source_entry in all_sources:
        snippet = source_entry.get("text", "")

        if not snippet:
            continue

        judgment = classify_snippet(snippet, claim, zero_shot_classifier = zero_shot_classifier)
        per_source.append({
            "source": source_entry.get("source"),
            "title": source_entry.get("title"),
            "url": source_entry.get("url"),
            "snippet": snippet,
            "label": judgment.get("label"),
            "score": judgment.get("score")
        })

    aggregate_result = aggregate_judgments(per_source)
    badge = make_badge_html(aggregate_result["verdict"], aggregate_result["confidence"])

    return {
        "claim": claim,
        "verdict": aggregate_result["verdict"],
        "confidence": aggregate_result["confidence"],
        "sources": all_sources,
        "per_source": per_source,
        "badge_html": badge
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

    parser = argparse.ArgumentParser(description = "Prototype fact-checker for Debate Match")
    parser.add_argument("claim", type = str, help = "Claim to fact-check (quote it).")
    parser.add_argument("--top", type = int, default = 3, help = "Top K results per source.")
    parser.add_argument("--no-news", action = "store_true", help = "Skip NewsAPI search.")
    parser.add_argument("--raw", action = "store_true", help = "Print raw JSON output.")
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
            print(f"- [{entry['source']}] {entry.get('title') or ''} -> {entry['label']} (score {entry['score']:.3f})")

            if entry.get("url"):
                print("  URL:", entry["url"])

            snippet_preview = (entry.get("snippet") or "")[:400]
            if snippet_preview:
                print("  Snippet:", snippet_preview.replace("\n", " "))

        print("\n(Use --raw for full JSON output)")

run_cli()