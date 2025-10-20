import os
from typing import Dict, Any
from wikipedia_api import wiki_search
from news_api import news_search
from classifier import safe_zero_shot_classifier, classify_snippet, aggregate_judgments
from text_utils import get_most_relevant_snippets


def make_badge_html(verdict: str, confidence: float) -> str:
    confidence_percent = int(round(confidence * 100))
    color_map = {
        "SUPPORTED": "#00ff6a",
        "REFUTED": "#ff1900",
        "NOT ENOUGH EVIDENCE": "#ffcc00"
    }
    color = color_map.get(verdict, "#494949")

# Main entry for verdicts
# Evaluates a claim using Wikipedia and news sources.
def claim_verdict(claim: str, top_k: int = 3, use_news: bool = True) -> Dict[str, Any]:
    if not claim.strip():
        raise ValueError("Claim must be non-empty")
    
    wiki_results = wiki_search(claim, limit=top_k)
    news_results = []
    news_api_key = os.environ.get("NEWSAPI_KEY")
    
    classifier = safe_zero_shot_classifier()
    
    if use_news and news_api_key:
        news_results = news_search(claim, limit=top_k, api_key=news_api_key, classifier=classifier)
    
    per_source = []
    
    # Wikipedia
    for entry in wiki_results:
        text = entry.get("extract") or entry.get("snippet") or ""
        if not text:
            continue
        snippets = get_most_relevant_snippets(claim, text, classifier)
        snippet_text = " ".join(snippets)
        judgment = classify_snippet(text, claim, classifier)
        per_source.append({
            "source": "wikipedia",
            "title": entry.get("title"),
            "url": entry.get("url"),
            "snippet": snippet_text,
            "label": judgment["label"],
            "score": judgment["score"]
        })
    
    # NewsAPI
    for entry in news_results:
        text = entry.get("text") or ""
        if not text:
            continue
        snippets = get_most_relevant_snippets(claim, text, classifier)
        snippet_text = " ".join(snippets)
        judgment = classify_snippet(text, claim, classifier)
        per_source.append({
            "source": entry.get("source"),
            "title": entry.get("title"),
            "url": entry.get("url"),
            "snippet": snippet_text,
            "label": judgment["label"],
            "score": judgment["score"]
        })
    
    if not per_source:
        verdict_data = {
            "verdict": "NOT ENOUGH EVIDENCE",
            "confidence": 0.0,
            "counts": {"supports": 0, "refutes": 0, "not enough evidence": 0}
        }
    else:
        verdict_data = aggregate_judgments(per_source)
    
    return {
        "claim": claim,
        "verdict": verdict_data["verdict"],
        "confidence": verdict_data["confidence"],
        "sources": wiki_results + news_results,
        "per_source": per_source,
        "badge_html": make_badge_html(verdict_data["verdict"], verdict_data["confidence"])
    }