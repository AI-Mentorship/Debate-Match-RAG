# Configuration constants and environment setup

WIKI_API_URL = "https://en.wikipedia.org/w/api.php"
ZERO_SHOT_MODEL = "facebook/bart-large-mnli"
NEWSAPI_ENV_VAR = "NEWSAPI_KEY"
HEADERS = {"User-Agent": "DebateMatch/1.0 (pavanarani00@gmail.com)"}

# Check for optional dependencies
try:
    from transformers import pipeline
    ZERO_SHOT_AVAILABLE = True
except Exception:
    ZERO_SHOT_AVAILABLE = False

try:
    from newsapi import NewsApiClient
    NEWSAPI_AVAILABLE = True
except Exception:
    NEWSAPI_AVAILABLE = False