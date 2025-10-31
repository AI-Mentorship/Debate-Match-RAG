HEAD
# DebateMatch RAG - Retriever

## Goal
**Find the most relevant debate passages for a query,** using sentence embeddings and FAISS similarity search to return top-k passages with metadata.

---

## Input Format
- **Query:** A plain text string entered by the user.
- **Dataset:** A CSV file (`debates.csv`) with debate annotations.  
  Columns used:
  - `Speaker/Candidate from Debate`
  - `Evidence Quote`
  - `Evidence Location`

**Example row in `debates.csv`:**
- Speaker/Candidate from Debate: Joe Biden  
- Evidence Quote: "To $15 for an insulin shot as opposed to $400. No senior has to pay more than $200 for any drug, all the drugs, beginning next year."  
- Evidence Location: 5:16  

---

## Output Format
- Output is a **list of JSON-like objects** (printed in console).  
- Each result includes:
  - `Speaker`
  - `Role`
  - `Timestamp`
  - `Text`
  - `Score`

**Example output for query: _"healthcare_"**
```json
[
    {
        "speaker": "Jake Tapper",
        "role": "Candidate",
        "debate": "2024 CNN PRESIDENTIAL DEBATE",
        "timestamp": "02:40",
        "text": "Now, please welcome the 46th President of the United States, Joe Biden.",
        "score": 0.9359586238861084
    },
    {
        "speaker": "Dana Bash",
        "role": "Candidate",
        "debate": "2024 CNN PRESIDENTIAL DEBATE",
        "timestamp": "13:37",
        "text": "This is the first presidential election since the Supreme Court overturned Roe v. Wade. Former President Trump, you take credit for the decision to overturn Roe v. Wade, which returned the issue of abortion to the states.",
        "score": 1.0521624088287354
    }
]
=======
# DebateMatch-RAG
Retriever) using FAISS + sentence embeddings
>>>>>>> f8f1c94cda496d83de99624d772dfb9dda09fc6b
