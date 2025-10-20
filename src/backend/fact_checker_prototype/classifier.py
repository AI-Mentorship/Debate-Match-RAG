from typing import Dict, Any, List
from config import ZERO_SHOT_AVAILABLE, ZERO_SHOT_MODEL
from text_utils import enhanced_similarity
from contradiction_detection import check_categorical_contradiction, check_numerical_contradiction

if ZERO_SHOT_AVAILABLE:
    from transformers import pipeline

# Return a zero-shot pipeline instance if available, else None.
def safe_zero_shot_classifier():
    if not ZERO_SHOT_AVAILABLE:
        return None
    try:
        return pipeline("zero-shot-classification", model=ZERO_SHOT_MODEL)
    except Exception:
        return None

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
            
            if score < 0.5 or confidence_margin < 0.2:
                return {"label": "not enough evidence", "score": score * 0.6}
            
            similarity = enhanced_similarity(claim, text)
            
            if mapped_label == "supports" and similarity < 0.3:
                return {"label": "not enough evidence", "score": similarity}
            
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