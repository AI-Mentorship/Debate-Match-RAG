# Debate Match Fact-Checking Module

This module is a fact-checking system for the Debate Match RAG pipeline. It verifies claims made in debates by leveraging external sources and a zero-shot classifier.

The module performs the following:

- Searches Wikipedia and NewsAPI (requires `NEWSAPI_KEY` environment variable).
- Classifies retrieved text snippets using a zero-shot classifier (`facebook/bart-large-mnli`) into:
  - `supports`
  - `refutes`
  - `not enough evidence`

- Aggregates snippet judgments into a **final verdict**:
  - `SUPPORTED`
  - `REFUTED`
  - `NOT ENOUGH EVIDENCE`

- Returns a **structured JSON** with:
  - Sources
  - Per-source verdicts
  - Aggregate verdict
  - Confidence
  - Badge

## Functions

The fact-checking module contains several helper and core functions to process claims, retrieve evidence, classify snippets, and produce a final verdict. Below is a detailed explanation:

### 1. `wiki_search`
Searches Wikipedia for the given `query` and returns a list of candidate pages, each containing:
- `title`: Wikipedia page title
- `snippet`: Short text snippet from search results
- `extract`: Introductory text from the page
- `url`: Direct link to the page

**Parameters:**  
- `query`: The claim or topic to search.  
- `limit`: Maximum number of results to return per query (default 3).  

**Returns:** List of dictionaries representing candidate pages.

---

### 2. `wiki_get_extract`
Retrieves the introductory extract (plain text) of a Wikipedia page.

**Parameters:**  
- `title`: Title of the Wikipedia page  

**Returns:** Extracted text as a string.

---

### 3. `news_search`
Searches news articles via NewsAPI using the provided query.

**Parameters:**  
- `query`: Claim or topic to search  
- `limit`: Number of articles to retrieve (default 3)  
- `api_key`: Optional API key (defaults to `NEWSAPI_KEY` environment variable)  

**Returns:** List of articles with:
- `source`, `title`, `snippet` (description), `url`

---

### Helper Functions

#### 4. `extract_key_terms`
Extracts significant terms from text by removing common stop words and short words.

**Parameters:**  
- `text`: Input text string  

**Returns:** List of filtered lowercase words (minimum 3 characters) excluding stop words.

**Stop words removed:** Common English words like 'the', 'is', 'at', 'which', 'a', 'an', 'in', 'of', 'to', etc.

---

#### 5. `extract_numbers`
Extracts all numerical values from text, including integers and decimals.

**Parameters:**  
- `text`: Input text string  

**Returns:** List of floats representing all numbers found in the text.

---

#### 6. `enhanced_similarity`
Calculates text similarity with emphasis on key term overlap rather than raw character matching.

**Parameters:**  
- `claim`: Claim text  
- `text`: Text to compare against  

**Returns:** Float similarity score (0–1) weighted as:
- 40% base sequence similarity  
- 60% key term overlap ratio

**Use case:** More accurate than simple string matching for evaluating whether a text passage addresses the claim's core concepts.

---

#### 7. `check_numerical_contradiction`
Detects contradictions between numerical values in the claim and source text.

**Parameters:**  
- `claim`: Claim containing numbers  
- `text`: Source text containing numbers  

**Returns:** Boolean indicating whether a numerical contradiction exists.

**Logic:**
1. Extracts numbers from both texts
2. Checks if contexts are related (at least 2 shared key terms)
3. Allows 5% tolerance for matching numbers
4. Flags contradiction if numbers differ by >10%

---

#### 8. `check_categorical_contradiction`
Detects contradictions in categorical claims following the pattern "X is/are Y".

**Parameters:**  
- `claim`: Categorical claim (e.g., "The Earth is flat")  
- `text`: Source text to check for contradictions  

**Returns:** Boolean indicating whether a categorical contradiction exists.

**Detection methods:**
1. **Debunking detection**: Checks if text describes the predicate as "disproven", "false", "myth", "misconception", "archaic", "incorrect", "untrue", or "debunk" within 50 characters
2. **Negation patterns**: Detects explicit negations like "X is not Y" or "X isn't Y"

---

### 9. `safe_zero_shot_classifier()`
Attempts to create a **zero-shot classification pipeline** using Hugging Face Transformers. Falls back to `None` if unavailable.

**Returns:** Zero-shot pipeline object or `None`.

---

### 10. `classify_snippet`
Classifies whether a snippet:
- Supports the claim  
- Refutes the claim  
- Provides insufficient evidence  

**Parameters:**  
- `snippet`: Text to classify  
- `claim`: The claim being fact-checked  
- `zero_shot_classifier`: Optional zero-shot classifier instance  

**Returns:** Dictionary with:
- `label`: One of `supports`, `refutes`, `not enough evidence`  
- `score`: Confidence score (0–1)

Uses a fallback heuristic if zero-shot classifier is not available, based on text similarity and presence of support/contradiction markers.

---

### 11. `aggregate_judgments`
Aggregates multiple snippet-level judgments into a **final verdict**.

**Parameters:**  
- `judgments`: List of snippet classification results  

**Returns:** Dictionary with:
- `verdict`: `SUPPORTED`, `REFUTED`, or `NOT ENOUGH EVIDENCE`  
- `confidence`: Average confidence of majority label  
- `counts`: Counts of each label type

---

### 12. `claim_verdict`
Main function to evaluate a claim using Wikipedia and optionally NewsAPI.

**Parameters:**  
- `claim`: Claim string to fact-check  
- `top_k`: Number of snippets to retrieve per source  
- `use_news`: Boolean to enable/disable NewsAPI  

**Returns:** Dictionary with:
- `claim`: Original claim  
- `verdict`: Aggregate verdict  
- `confidence`: Confidence score  
- `sources`: Raw sources retrieved  
- `per_source`: Individual snippet judgments  
- `badge_html`: Colored badge representing verdict and confidence

---

### 13. `make_badge_html`
Generates a **colored HTML badge** representing the verdict and confidence.  
Colors:  
- Green (`SUPPORTED`)  
- Red (`REFUTED`)  
- Yellow (`NOT ENOUGH EVIDENCE`)

---

### 14. `run_cli()`
Command-line interface for testing the fact-checker.

**Features:**  
- Accepts a claim from the terminal  
- Options to set `top_k` results per source  
- Option to skip NewsAPI  
- Option to print raw JSON output

**Example usage:**
```bash
python fact_check.py "Healthcare is free in the United States."
```

**Dependencies**
```bash
pip install requests transformers newsapi newsapi-python
```

**NEWSAPI**
```bash
# Run these commands in your terminal so you can use NEWSAPI
echo 'export NEWSAPI_KEY="your_api_key_here"' >> ~/.zshrc
source ~/.zshrc
```