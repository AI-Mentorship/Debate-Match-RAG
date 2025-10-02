# **Happy Birthday :v 🫶**

This project aims to build an AI-powered debate matcher that allows users to ask political questions and receive factually grounded answers based on political debate transcripts.

The system will employ a Retrieval-Augmented Generation (RAG) framework to retrieve relevant excerpts and generate coherent responses. A fact-checking layer will be integrated, comparing candidate statements against verified fact-checking sources to ensure accuracy.

The project will begin with local debates (e.g., mayoral races) before scaling up to larger elections, with the ultimate goal of improving political transparency and accessibility through an interactive tool.

## **Programming Languages**

- **Python:** primary, for NLP pipelines, data preprocessing, and backend logic

- **SQL:** for storing transcripts, metadata, and fact-checking references

## **Technology Stacks**

- **Frontend:** JavaScript (React.js or Streamlit)

- **Backend:** Python (LangChain, Hugging Face Transformers, scikit-learn, pandas, numpy)

- **Databases:** PostgreSQL / MongoDB (for transcripts and fact-check metadata)

- **AI/NLP:** Retrieval-Augmented Generation (RAG), spaCy, OpenAI/LLMs, fact-checking APIs

- **Visualization:** matplotlib, Plotly/Dash (for interactive debate insights)

## **Project Structure**

```bash
Debate-Match-RAG
├── debate_ai/
│   ├── main.py                                 # Entry point
│   └── src/
│       └── debate_ai/
│           ├── backend/                        # Core application logic and data processing
│           │   ├── data/
│           │   │   └── sample_data.csv
│           │   │
│           │   ├── database/                   # Database setup
│           │   │   ├── __init__.py
│           │   │   ├── config.py
│           │   │   ├── connection.py
│           │   │   ├── insert.py
│           │   │   └── README.md               # Database documentation
│           │   │
│           │   ├── embeddings_faiss/           # Embeddings + FAISS
│           │   │   ├── embedding.py
│           │   │   └── faiss.py
│           │   │
│           │   └── retriever/                  # Retriever
│           │       └── retriever.py
│           │
│           └── frontend/                       # UI components
│               └── something.txt
│
├── README.md
└── requirements.txt
```

## **Contributors**

- Mentors:

    - Adya Dhanasekar
    
    - Shivam Singh

- Mentees

    - Raisa Reza

    - Yakina Azza

    - Sadwitha Thopucharla

    - Khang Doan

    - Pavan Arani

    - Satyank Nadimpalli