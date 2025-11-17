import os
import re
import json
import requests
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass
from difflib import SequenceMatcher
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    WIKI_API_URL = "https://en.wikipedia.org/w/api.php"
    ZERO_SHOT_MODEL = "facebook/bart-large-mnli"
    NEWSAPI_ENV_VAR = "NEWSAPI_KEY"
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
    HEADERS = {"User-Agent": "DebateMatch/1.0 (fact-checker)"}
    
    # Check for optional dependencies
    ZERO_SHOT_AVAILABLE = False
    NEWSAPI_AVAILABLE = False
    
    try:
        from transformers import pipeline
        ZERO_SHOT_AVAILABLE = True
    except:
        pass
    
    try:
        from newsapi import NewsApiClient
        NEWSAPI_AVAILABLE = True
    except:
        pass


# ============================================================================
# TEXT UTILITIES
# ============================================================================

class TextUtils:
    # Extract meaningful words, removing stop words.
    STOP_WORDS = {
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
        'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'in', 'of', 'to', 'for', 'with', 'by', 'from', 'that', 'this'
    }
    
    @staticmethod
    def extract_key_terms(text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        return [w for w in words if w not in TextUtils.STOP_WORDS and len(w) > 2]
    
    # Extract all numbers from text.
    @staticmethod
    def extract_numbers(text: str) -> List[float]:
        return [float(n) for n in re.findall(r'\b\d+(?:\.\d+)?\b', text)]
    
    # Calculate similarity emphasizing key term overlap.
    @staticmethod
    def enhanced_similarity(claim: str, text: str) -> float:
        base_sim = SequenceMatcher(None, claim.lower(), text.lower()).ratio()
        claim_terms = set(TextUtils.extract_key_terms(claim))
        text_terms = set(TextUtils.extract_key_terms(text))
        
        if not claim_terms:
            return base_sim
        
        term_overlap = len(claim_terms & text_terms) / len(claim_terms)
        return 0.4 * base_sim + 0.6 * term_overlap
    
    # Extract the most relevant snippets from text for a given claim.
    @staticmethod
    def get_most_relevant_snippets(claim: str, text: str, top_n: int = 3) -> List[str]:
        if not text:
            return []
        
        sentences = re.split(r'(?<=[.!?])\s+', text)
        if not sentences:
            return [text[:200]]
        
        # Score each sentence
        scored = [(s, TextUtils.enhanced_similarity(claim, s)) for s in sentences]
        scored.sort(key=lambda x: x[1], reverse=True)
        
        return [s for s, _ in scored[:top_n]]


# ============================================================================
# CONTRADICTION DETECTION
# ============================================================================

class ContradictionDetector:

    # Detect if numbers in claim contradict those in text.
    @staticmethod
    def check_numerical_contradiction(claim: str, text: str) -> bool:
        claim_nums = TextUtils.extract_numbers(claim)
        text_nums = TextUtils.extract_numbers(text)
        
        if not claim_nums or not text_nums:
            return False
        
        claim_terms = set(TextUtils.extract_key_terms(claim))
        text_terms = set(TextUtils.extract_key_terms(text))
        if len(claim_terms & text_terms) < 2:
            return False
        
        # Check for significantly different numbers (>10% difference)
        for cn in claim_nums:
            for tn in text_nums:
                if cn > 0 and tn > 0:
                    if abs(cn - tn) / max(cn, tn) > 0.1:
                        return True
        
        return False
    
    # Detect contradictions in categorical claims like 'X is Y'.
    @staticmethod
    def check_categorical_contradiction(claim: str, text: str) -> bool:
        match = re.search(r'^(.+?)\s+(is|are)\s+(.+)$', claim.lower().strip())
        if not match:
            return False
        
        subject = match.group(1).strip()
        predicate = match.group(3).strip()
        text_lower = text.lower()
        
        debunk_words = ['disproven', 'false', 'myth', 'misconception', 'archaic', 
                       'incorrect', 'untrue', 'debunk']
        
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


# ============================================================================
# WIKIPEDIA API
# ============================================================================

class WikipediaAPI:

    # Search Wikipedia and return list of candidate pages with title and snippet (extract).
    @staticmethod
    def search(query: str, limit: int = 3) -> List[Dict[str, Any]]:
        parameters = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srlimit": limit,
            "format": "json",
            "srprop": "snippet"
        }
        
        try:
            response = requests.get(
                Config.WIKI_API_URL,
                params=parameters,
                headers=Config.HEADERS,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            results = []
            
            for entry in data.get("query", {}).get("search", []):
                title = entry.get("title")
                extract = WikipediaAPI.get_extract(title)
                results.append({
                    "source": "Wikipedia",
                    "title": title,
                    "snippet": entry.get("snippet", ""),
                    "extract": extract,
                    "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                    "credibility": 0.85
                })
            
            return results
        except Exception as e:
            print(f"⚠️  Wikipedia API error: {e}")
            return []
    
    # Get the introductory extract text from a Wikipedia page by title.
    @staticmethod
    def get_extract(title: str) -> str:
        parameters = {
            "action": "query",
            "prop": "extracts",
            "exintro": True,
            "explaintext": True,
            "titles": title,
            "format": "json",
            "redirects": 1
        }
        
        try:
            response = requests.get(
                Config.WIKI_API_URL,
                params=parameters,
                headers=Config.HEADERS,
                timeout=10
            )
            response.raise_for_status()
            pages = response.json().get("query", {}).get("pages", {})
            
            for _, page in pages.items():
                return page.get("extract", "")
        except:
            pass
        
        return ""


# ============================================================================
# NEWS API
# ============================================================================

class NewsAPI:
    
    CREDIBLE_SOURCES = {
        "BBC News", "Reuters", "Associated Press", "The Guardian", "Al Jazeera English",
        "The Washington Post", "The New York Times", "Time", "Politico", "Bloomberg",
        "National Geographic", "New Scientist", "Scientific American", "Nature",
        "Medical News Today", "Live Science", "NPR", "The Hill", "ABC News",
        "CBS News", "NBC News", "USA Today", "Axios"
    }
    
    # Search news using NewsAPI. Requires NEWSAPI_KEY in env or passed explicitly.
    # Returns top articles with title + description + url.
    @staticmethod
    def search(claim: str, limit: int = 3, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        if not Config.NEWSAPI_AVAILABLE or not api_key:
            return []
        
        try:
            from newsapi import NewsApiClient
            
            client = NewsApiClient(api_key=api_key)
            result = client.get_everything(
                q=claim,
                language="en",
                sort_by="relevancy",
                page_size=limit * 6
            )
            
            articles = result.get("articles", [])
            if not articles:
                return []
            
            candidates = []
            for article in articles:
                source_name = article.get("source", {}).get("name", "Unknown")
                title = article.get("title") or ""
                description = article.get("description") or ""
                content = article.get("content") or ""
                combined_text = " ".join(filter(None, [title, description, content]))
                
                sim = TextUtils.enhanced_similarity(claim, combined_text)
                credibility_boost = 0.1 if source_name in NewsAPI.CREDIBLE_SOURCES else 0.0
                final_score = sim + credibility_boost
                
                # Determine credibility score
                if source_name in ["Reuters", "Associated Press", "BBC News"]:
                    credibility = 0.95
                elif source_name in NewsAPI.CREDIBLE_SOURCES:
                    credibility = 0.85
                else:
                    credibility = 0.70
                
                snippets = TextUtils.get_most_relevant_snippets(claim, combined_text)
                snippet_text = " ".join(snippets) if snippets else ""
                
                candidates.append({
                    "source": source_name,
                    "title": title,
                    "snippet": snippet_text,
                    "extract": combined_text,
                    "url": article.get("url"),
                    "similarity": final_score,
                    "credibility": credibility
                })
            
            candidates.sort(key=lambda x: x["similarity"], reverse=True)
            return candidates[:limit]
            
        except Exception as e:
            print(f"⚠️  NewsAPI error: {e}")
            return []


# ============================================================================
# OPENAI INTEGRATION
# ============================================================================

class OpenAIIntegration:
    
    @staticmethod
    def get_embedding(text: str) -> Optional[List[float]]:
        
        # Get embedding vector for text.
        if not Config.OPENAI_API_KEY:
            return None
        
        try:
            response = requests.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {Config.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "text-embedding-3-small",
                    "input": text
                },
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["data"][0]["embedding"]
        except Exception as e:
            print(f"⚠️  OpenAI embedding error: {e}")
        
        return None
    
    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        
        # Calculate cosine similarity between two vectors.
        if not vec1 or not vec2:
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    @staticmethod
    def verify_with_llm(claim: str, evidence: List[Dict]) -> Tuple[str, float, str, List[str], List[str]]:
        
        # Use LLM to verify claim against evidence.
        if not Config.OPENAI_API_KEY or not evidence:
            return "NOT ENOUGH EVIDENCE", 0.0, "No LLM verification available", [], []
        
        try:
            # Prepare evidence text with source titles
            evidence_text = "\n\n".join([
                f"[{src['title']}] ({src['source']} - credibility: {src.get('credibility', 0.5):.0%}):\n{src.get('extract', src.get('snippet', ''))[:500]}"
                for src in evidence[:5]
            ])
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {Config.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are an expert fact-checker. Analyze the claim against the provided evidence and determine:
1. Verdict: SUPPORTED, REFUTED, PARTIALLY SUPPORTED, or NOT ENOUGH EVIDENCE
2. Confidence: 0-100 (how certain you are)
3. Explanation: Brief reasoning for your verdict
4. Supporting evidence: List of evidence that supports the claim
5. Contradicting evidence: List of evidence that contradicts the claim

IMPORTANT: When referring to sources in your evidence lists, always use the source title shown in brackets [Title]

Return as JSON with keys: verdict, confidence, explanation, supporting_evidence, contradicting_evidence"""
                        },
                        {
                            "role": "user",
                            "content": f"Claim: {claim}\n\nEvidence:\n{evidence_text}\n\nAnalyze and return JSON:"
                        }
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.1
                },
                timeout=20
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                analysis = json.loads(content)
                
                verdict = analysis.get("verdict", "NOT ENOUGH EVIDENCE").upper()
                confidence = float(analysis.get("confidence", 0))
                explanation = analysis.get("explanation", "")
                supporting = analysis.get("supporting_evidence", [])
                contradicting = analysis.get("contradicting_evidence", [])
                
                return verdict, confidence, explanation, supporting, contradicting
                
        except Exception as e:
            print(f"⚠️  LLM verification error: {e}")
        
        return "NOT ENOUGH EVIDENCE", 0.0, "LLM verification failed", [], []


# ============================================================================
# CLASSIFIER
# ============================================================================

class Classifier:

    @staticmethod
    def get_zero_shot_classifier():
        # Return zero-shot classifier if available.
        if not Config.ZERO_SHOT_AVAILABLE:
            return None
        
        try:
            from transformers import pipeline
            return pipeline("zero-shot-classification", model=Config.ZERO_SHOT_MODEL)
        except:
            return None
    
    @staticmethod
    def classify_snippet(snippet: str, claim: str, zero_shot_classifier=None) -> Dict[str, Any]:
        
        # Priority 1: Check for categorical contradictions
        if ContradictionDetector.check_categorical_contradiction(claim, snippet):
            return {"label": "refutes", "score": 0.90}
        
        # Priority 2: Check for numerical contradictions
        if ContradictionDetector.check_numerical_contradiction(claim, snippet):
            return {"label": "refutes", "score": 0.85}
        
        # Priority 3: Use zero-shot classifier if available
        if zero_shot_classifier:
            try:
                text = snippet[:500]
                result = zero_shot_classifier(
                    text,
                    ["supports the claim", "refutes the claim", "no evidence"],
                    multi_label=False
                )
                
                label_map = {
                    "supports the claim": "supports",
                    "refutes the claim": "refutes",
                    "no evidence": "not enough evidence"
                }
                
                top_label = result["labels"][0]
                score = float(result["scores"][0])
                mapped_label = label_map.get(top_label, "not enough evidence")
                
                return {"label": mapped_label, "score": score}
            except:
                pass
        
        # Fallback: Rule-based classification
        similarity = TextUtils.enhanced_similarity(claim, snippet)
        text_lower = snippet.lower()
        
        negation_words = ['not', 'no', 'never', 'false', 'incorrect', 'deny', 'myth', 'disproven']
        has_negation = any(word in text_lower for word in negation_words)
        
        if similarity > 0.4:
            if has_negation:
                return {"label": "refutes", "score": similarity}
            else:
                return {"label": "supports", "score": similarity}
        
        return {"label": "not enough evidence", "score": similarity}
    
    @staticmethod
    def aggregate_judgments(judgments: List[Dict[str, Any]]) -> Dict[str, Any]:
        # Aggregate multiple snippet judgments into final verdict.
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
        
        # Determine majority verdict
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


# ============================================================================
# MAIN FACT CHECKER
# ============================================================================

class Verdict(Enum):
    SUPPORTED = "Supported"
    REFUTED = "Refuted"
    PARTIALLY_SUPPORTED = "Partially Supported"
    NOT_ENOUGH_EVIDENCE = "Not Enough Evidence"


@dataclass
class FactCheckResult:
    claim: str
    verdict: str
    confidence: float
    badge: str
    sources: List[Dict]
    explanation: str
    evidence_for: List[str]
    evidence_against: List[str]
    per_source: List[Dict]


class EnhancedFactChecker:
    
    # Enhanced fact-checker integrating existing architecture with advanced features.
    def __init__(
        self,
        use_wikipedia: bool = True,
        use_news_api: bool = True,
        use_llm_verification: bool = True,
        use_semantic_similarity: bool = True
    ):

        self.use_wikipedia = use_wikipedia
        self.use_news_api = use_news_api
        self.use_llm_verification = use_llm_verification
        self.use_semantic_similarity = use_semantic_similarity
        
        # Check API keys
        if use_news_api and not Config.NEWSAPI_KEY:
            print("⚠️  NEWSAPI_KEY not found. News verification disabled.")
            self.use_news_api = False
        
        if use_llm_verification and not Config.OPENAI_API_KEY:
            print("⚠️  OPENAI_API_KEY not found. LLM verification disabled.")
            self.use_llm_verification = False
        
        # Initialize classifier
        self.zero_shot_classifier = Classifier.get_zero_shot_classifier()
    
    def check_claim(self, claim: str, top_k: int = 3) -> FactCheckResult:
        
        # Main method to fact-check a claim with maximum accuracy.
        print(f"\nFact-checking: {claim[:80]}...")
        
        if not claim.strip():
            raise ValueError("Claim must be non-empty")
        
        # Step 1: Gather evidence from sources
        all_sources = []
        per_source = []
        
        # Wikipedia
        if self.use_wikipedia:
            print("Searching Wikipedia...")
            wiki_results = WikipediaAPI.search(claim, limit=top_k)
            all_sources.extend(wiki_results)
            print(f"   ✓ Found {len(wiki_results)} Wikipedia sources")
            
            # Process Wikipedia results
            for entry in wiki_results:
                text = entry.get("extract") or entry.get("snippet") or ""
                if not text:
                    continue
                
                snippets = TextUtils.get_most_relevant_snippets(claim, text)
                snippet_text = " ".join(snippets)
                judgment = Classifier.classify_snippet(text, claim, self.zero_shot_classifier)
                
                per_source.append({
                    "source": entry["source"],
                    "title": entry["title"],
                    "url": entry["url"],
                    "snippet": snippet_text,
                    "label": judgment["label"],
                    "score": judgment["score"],
                    "credibility": entry["credibility"]
                })
        
        # NewsAPI
        if self.use_news_api:
            print("Searching news sources...")
            news_results = NewsAPI.search(claim, limit=top_k, api_key=Config.NEWSAPI_KEY)
            all_sources.extend(news_results)
            print(f"   ✓ Found {len(news_results)} news sources")
            
            # Process news results
            for entry in news_results:
                text = entry.get("extract") or ""
                if not text:
                    continue
                
                snippets = TextUtils.get_most_relevant_snippets(claim, text)
                snippet_text = " ".join(snippets)
                judgment = Classifier.classify_snippet(text, claim, self.zero_shot_classifier)
                
                per_source.append({
                    "source": entry["source"],
                    "title": entry["title"],
                    "url": entry["url"],
                    "snippet": snippet_text,
                    "label": judgment["label"],
                    "score": judgment["score"],
                    "credibility": entry.get("credibility", 0.70)
                })
        
        if not all_sources:
            print("   ⚠️  No evidence found")
            return FactCheckResult(
                claim=claim,
                verdict="NOT ENOUGH EVIDENCE",
                confidence=0.0,
                badge="?",
                sources=[],
                explanation="No sources found to verify this claim.",
                evidence_for=[],
                evidence_against=[],
                per_source=[]
            )
        
        print(f"   ✓ Total sources: {len(all_sources)}")
        
        # Step 2: Aggregate source judgments
        verdict_data = Classifier.aggregate_judgments(per_source)
        base_verdict = verdict_data["verdict"]
        base_confidence = verdict_data["confidence"]
        
        # Step 3: LLM verification (if enabled)
        llm_verdict = None
        llm_confidence = 0.0
        explanation = ""
        evidence_for = []
        evidence_against = []
        
        if self.use_llm_verification:
            print("LLM verification...")
            llm_verdict, llm_confidence, explanation, evidence_for, evidence_against = \
                OpenAIIntegration.verify_with_llm(claim, all_sources)
            print(f"   ✓ LLM: {llm_verdict} ({llm_confidence:.0f}% confidence)")
        
        # Step 4: Semantic similarity verification (if enabled)
        semantic_score = 0.0
        if self.use_semantic_similarity and Config.OPENAI_API_KEY:
            print("Semantic analysis...")
            claim_embedding = OpenAIIntegration.get_embedding(claim)
            if claim_embedding:
                similarities = []
                for source in all_sources:
                    text = source.get("extract", source.get("snippet", ""))[:500]
                    source_embedding = OpenAIIntegration.get_embedding(text)
                    if source_embedding:
                        sim = OpenAIIntegration.cosine_similarity(claim_embedding, source_embedding)
                        credibility = source.get("credibility", 0.7)
                        similarities.append(sim * credibility)
                
                if similarities:
                    semantic_score = sum(similarities) / len(similarities)
                    print(f"   ✓ Semantic similarity: {semantic_score:.2f}")
        
        # Step 5: Combine verdicts
        final_verdict = base_verdict
        final_confidence = base_confidence
        
        if llm_verdict and llm_confidence > 0:
            # Weight LLM verdict more heavily
            if llm_verdict == base_verdict:
                final_confidence = (base_confidence * 0.4 + llm_confidence * 0.6)
            else:
                # LLM disagrees - use LLM if more confident
                if llm_confidence > base_confidence:
                    final_verdict = llm_verdict
                    final_confidence = llm_confidence * 0.8
        
        # Adjust confidence based on semantic similarity
        if semantic_score > 0:
            final_confidence = final_confidence * 0.7 + semantic_score * 30
        
        # Generate explanation if not from LLM
        if not explanation:
            explanation = self._generate_explanation(final_verdict, all_sources, verdict_data["counts"])
        
        # Assign badge
        badge_map = {
            "SUPPORTED": "✓",
            "REFUTED": "✗",
            "PARTIALLY SUPPORTED": "~",
            "NOT ENOUGH EVIDENCE": "?"
        }
        
        print(f"\nFinal verdict: {final_verdict} ({final_confidence:.0f}% confidence)\n")
        
        return FactCheckResult(
            claim=claim,
            verdict=final_verdict,
            confidence=min(final_confidence, 100.0),
            badge=badge_map.get(final_verdict, "?"),
            sources=all_sources[:5],
            explanation=explanation,
            evidence_for=evidence_for,
            evidence_against=evidence_against,
            per_source=per_source
        )
    
    def _generate_explanation(self, verdict: str, sources: List[Dict], counts: Dict) -> str:
        total_sources = len(sources)
        
        explanations = {
            "SUPPORTED": f"The claim is supported by {counts.get('supports', 0)} of {total_sources} sources.",
            "REFUTED": f"The claim is refuted by {counts.get('refutes', 0)} of {total_sources} sources.",
            "PARTIALLY SUPPORTED": f"The claim is partially supported by available evidence from {total_sources} sources.",
            "NOT ENOUGH EVIDENCE": f"Insufficient evidence from {total_sources} sources to verify this claim."
        }
        
        return explanations.get(verdict, "")
    
    def check_answer(self, llm_answer: str) -> FactCheckResult:
        # Extract claim from LLM answer and fact-check it.
        # Simple extraction - take text before first parenthesis
        claim = llm_answer.split("(")[0].strip()
        
        return self.check_claim(claim)