# Debate Match Fact-Checking Module (Prototype)

This module is a prototype fact-checking system for the Debate Match RAG pipeline. It verifies claims made in debates by leveraging external sources and a zero-shot classifier.

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

### 4. `safe_zero_shot_classifier()`
Attempts to create a **zero-shot classification pipeline** using Hugging Face Transformers. Falls back to `None` if unavailable.

**Returns:** Zero-shot pipeline object or `None`.

---

### 5. `classify_snippet`
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

### 6. `aggregate_judgments`
Aggregates multiple snippet-level judgments into a **final verdict**.

**Parameters:**  
- `judgments`: List of snippet classification results  

**Returns:** Dictionary with:
- `verdict`: `SUPPORTED`, `REFUTED`, or `NOT ENOUGH EVIDENCE`  
- `confidence`: Average confidence of majority label  
- `counts`: Counts of each label type

---

### 7. `claim_verdict`
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

### 8. `make_badge_html`
Generates a **colored HTML badge** representing the verdict and confidence.  
Colors:  
- Green (`SUPPORTED`)  
- Red (`REFUTED`)  
- Yellow (`NOT ENOUGH EVIDENCE`)

---

### 9. `run_cli()`
Command-line interface for testing the fact-checker.

**Features:**  
- Accepts a claim from the terminal  
- Options to set `top_k` results per source  
- Option to skip NewsAPI  
- Option to print raw JSON output

**Example usage:**
```bash
python fact_check.py "Healthcare is free in the United States."

## Installation

# Run these commands in your terminal so you can use NEWSAPI
```bash
echo 'export NEWSAPI_KEY="your_api_key_here"' >> ~/.zshrc
source ~/.zshrc

```bash
pip install requests transformers newsapi newsapi-python