from typing import List, Dict, Any, Optional
from config import NEWSAPI_AVAILABLE
from text_utils import enhanced_similarity, get_most_relevant_snippets

if NEWSAPI_AVAILABLE:
    from newsapi import NewsApiClient

# Search news using NewsAPI. Requires NEWSAPI_KEY in env or passed explicitly.
# Returns top articles with title + description + url.
def news_search(claim: str, limit: int = 3, api_key: Optional[str] = None, classifier = None) -> List[Dict[str, Any]]:
    if not NEWSAPI_AVAILABLE or not api_key:
        return []
    
    client = NewsApiClient(api_key = api_key)
    try:
        result = client.get_everything(
            q = claim,
            language = "en",
            sort_by = "relevancy",
            page_size = limit * 6
        )
    except Exception as e:
        print("NewsAPI error:", e)
        return []
    
    articles = result.get("articles", [])
    if not articles:
        return []
    
    credible_names = {
        "BBC News", "Reuters", "Associated Press", "The Guardian", "Al Jazeera English",
        "The Washington Post", "The New York Times", "Time", "Politico", "Bloomberg",
        "National Geographic", "New Scientist", "Scientific American", "Nature",
        "Medical News Today", "Live Science", "NPR", "The Hill", "ABC News",
        "CBS News", "NBC News", "USA Today", "Axios"
    }
    
    candidates = []
    for article in articles:
        source_name = article.get("source", {}).get("name", "Unknown")
        title = article.get("title") or ""
        description = article.get("description") or ""
        content = article.get("content") or ""
        combined_text = " ".join(filter(None, [title, description, content]))
        
        sim = enhanced_similarity(claim, combined_text)
        credibility_boost = 0.1 if source_name in credible_names else 0.0
        final_score = sim + credibility_boost
        
        snippets = get_most_relevant_snippets(claim, combined_text, classifier)
        snippet_text = " ".join(snippets) if snippets else ""
        
        candidates.append({
            "source": source_name,
            "title": title,
            "snippet": snippet_text,
            "url": article.get("url"),
            "similarity": final_score,
            "text": combined_text
        })
    
    candidates.sort(key = lambda x: x["similarity"], reverse=True)
    return candidates[:limit]