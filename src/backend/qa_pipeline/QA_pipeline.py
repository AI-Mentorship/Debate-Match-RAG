
# Import the OllamaEmbeddings class from the LangChain community embeddings module.
from langchain_community.embeddings import OllamaEmbeddings
# Below returns an Ollama embedding model instance using 'mistral' model.
def get_embedding_function():
    return OllamaEmbeddings(model="mistral")

import json
import os
from langchain.docstore.document import Document
from langchain.vectorstores import Chroma

CHROMA_PATH = "chroma"
embedding_function = get_embedding_function()

# --- Step 1: Load passages from JSON ---
with open("passages.json", "r") as f:
    passages = json.load(f)

# --- Step 2: Convert each JSON entry into a Document ---
new_documents = [
    Document(
        page_content=p["text"],
        metadata={
            "candidate": p.get("candidate"),
            "timestamp": p.get("timestamp")
        }
    )
    for p in passages
]

# --- Step 3: Load existing Chroma database (if any) ---
if os.path.exists(CHROMA_PATH):
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
    existing = db.get()  # returns dict with 'ids', 'documents', and 'metadatas'
    existing_texts = set(existing["documents"]) if existing["documents"] else set()
else:
    db = Chroma.from_documents([], embedding_function, persist_directory=CHROMA_PATH)
    existing_texts = set()

# --- Step 4: Filter out duplicates ---
unique_documents = [doc for doc in new_documents if doc.page_content not in existing_texts]

# --- Step 5: Add only unique documents ---
if unique_documents:
    db.add_documents(unique_documents)
    db.persist()
    print(f"✅ Added {len(unique_documents)} new unique passages.")
else:
    print("⚙️ No new passages to add. Everything is already stored.")

# --- Optional: Inspect database content ---
# all_docs = db.get()
# print(all_docs["documents"])

from langchain.prompts import ChatPromptTemplate
from langchain_community.llms import Ollama
from langchain.vectorstores import Chroma

## Template for the prompt:
PROMPT_TEMPLATE = """
Answer the question based only on the given context And provide corresponding candidate and timestamp:

{context}

---

Answer the question based on the above context only: {question}
"""

def query_rag(query_text):
    # Reload the Chroma vector database from disk
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

    # Retrieves similar passages to the query
    results = db.similarity_search_with_score(query_text, k=40)
    #print(results)
    #print("????????")

    # Build context text
    context_text = "\n\n---\n\n".join([
        f"{doc.page_content} (Source: {doc.metadata.get('candidate')}, {doc.metadata.get('timestamp')})"
        for doc, _ in results
    ])

    # Format the prompt using the context and user question
    prompt_str = ChatPromptTemplate.from_template(PROMPT_TEMPLATE).format_messages(
        context=context_text, question=query_text
    )

    # Initialize the Ollama model (using the 'mistral' model)
    model = Ollama(model="mistral")
    # Generate the response from the model
    response = model.invoke(prompt_str)

    # Collect sources for the retrieved documents
    #sources = [
     #   f"{doc.metadata.get('candidate') or 'unknown'} ({doc.metadata.get('timestamp') or 'N/A'})"
      #  for doc, _ in results
    #]

    # Print the model's response
    print(" Response:", response)

    # FOLLOWING ARE MY TRIALS FOR SOURCE - TO GET CANDIDATE AND TIMESTAMP
    #print(" Sources:", sources )
    #print(results[0][0].metadata["candidate"], results[0][0].metadata["timestamp"])
    #unique_sources = {(doc.metadata["candidate"], doc.metadata["timestamp"]) for doc, _ in results}
    #unique_sources_list = list(unique_sources)

    #print(" Sources:")
    #for candidate, timestamp in unique_sources:
    #last_candidate, last_timestamp = unique_sources_list[-1]
        #print(f"   - {candidate} ({timestamp})")

if __name__ == "__main__":
    # Prompt user for a question and run the RAG query
    user_question = input(" Enter your question: ")
    query_rag(user_question)

