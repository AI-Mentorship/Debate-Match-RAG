## **DebateMatch - QA pipeline**

A Python-based Retrieval-Augmented Generation (RAG) pipeline that uses Ollama embeddings (via LangChain) and Chroma vector database to embed, store, and query passages efficiently. It enables local semantic search and context-aware question answering using the Mistral model.

## **Overview**

This tool allows you to:
- Load passages from a JSON file
- Convert them into LangChain Document objects
- Generate vector embeddings using Ollama’s mistral model
- Store and manage them in a Chroma vector database
- Automatically filter and add only new, unique passages
- Query the database with semantic similarity search
- Get contextual answers powered by the Mistral LLM

## **Prerequisites**
- Python 3.9+
- Ollama installed and running locally
- mistral model pulled in Ollama: 
```bash
ollama pull mistral
```
- passages.json file containing text passages
- Installed Python dependencies

## **Installation**
Install dependencies:
```bash
pip install langchain-ollama
```
```bash
pip install -U langchain-chroma langchain-ollama
```
```bash
pip install -U langchain-ollama
```

## **Usage**
```bash
python QA_Pipeline.py
```


## **Code Workflow**

1) Embedding Setup
The function get_embedding_function() returns an OllamaEmbeddings instance using the mistral model.

2) Loading and Converting Data
    - Reads passages.json
    - Converts each entry into a LangChain Document
    - Attaches metadata (candidate, timestamp)

3) Managing the Chroma Database
    - Loads existing Chroma database if present
    - Filters out duplicates (based on passage text)
    - Adds only unique new documents
    - Persists updates for later use

4) Querying the Database
The function query_rag(query_text):
    - Reloads the Chroma vectorstore
    - Retrieves top 40 similar passages using semantic search
    - Builds a context block from retrieved documents
    - Passes context and query into Mistral model through a structured prompt
    - Prints the generated answer

## **Input Format**
1) The input file passages.json must be a JSON array containing multiple objects. Each object represents a passage with its text and metadata.

Example passages.json file:
```json
#The Below is passages.json file

import json

passages = [
  {
    "candidate": "Biden1",
    "timestamp": "00:15:45",
    "text": "Biden noted that while the U.S. makes up about 4% of the world’s population, it accounts for roughly 20% of global COVID-19 deaths and has recorded over seven million cases."
    
  },
  {
    "candidate": "Biden2",
    "timestamp": "00:13:45",
    "text": "Biden claimed that stripping the ACA would remove protections for pre-existing conditions and hurt women by allowing insurers to charge more for some conditions, e.g. pregnancy."
  },
  {
    "candidate": "Trump3",
    "timestamp": "00:14:45",
    "text": "Trump highlighted a fast “V-shaped” recovery with record job gains and reopening, while Biden argued it’s a “K-shaped” recovery, benefiting the wealthy but leaving working families, small towns, and businesses struggling."
  },
  {
    "candidate": "Trump4",
    "timestamp": "00:12:45",
    "text": "Trump argued that since his party won the Presidency and Senate, they have the right and duty to fill the Supreme Court seat; he praised Barrett’s credentials heavily."
  }
]
```

2) Enter a Query as input
The user provides a query as a plain text string. This query represents the question or topic the user wants the program to process or retrieve information about.

Example:
- Query: "What did Biden claim would happen if the Affordable Care Act were struck down?"

The program will use this input to generate a relevant passage as output.

## **Output Format**
The program generates a passage that is directly relevant to the question asked. Each passage includes:
- The timestamp indicating when the statement was made.
- The speaker’s name identifying who made the statement.
This ensures that the output clearly shows who said what and when, making it easy to trace information in context.


















