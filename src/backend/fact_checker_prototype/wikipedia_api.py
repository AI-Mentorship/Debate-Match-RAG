import requests
from typing import List, Dict, Any
from .config import WIKI_API_URL, HEADERS

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
    
    response = requests.get(WIKI_API_URL, params=parameters, headers=HEADERS, timeout=10)
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
    
    response = requests.get(WIKI_API_URL, params=parameters, headers=HEADERS, timeout=10)
    response.raise_for_status()
    pages = response.json().get("query", {}).get("pages", {})
    
    for _, page in pages.items():
        return page.get("extract", "")
    
    return ""