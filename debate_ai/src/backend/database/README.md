# **Database Setup**

Store clean transcripts in a queryable format.

## **Schema Diagram and Description**

#### **1. speakers**

```json
{
    "speaker_id": "Speaker's ID, Primary Key, String",
    "name": "Speaker's name, String",
    "role": "Speaker's role, String"
}
```

#### **2. debates**

```json
{
    "debate_id": "Debate ID, Primary Key, String",
    "name": "Debate name, String",
    "date": "Debate date"
}
```

#### **3. utterances**

```json
{
    "utterance_id": "Utterance ID, Primary Key, String",
    "debate_id": "Links to debates collection, debates.debate_id, String",
    "speaker_id": "Links to speakers collection, speakers.speaker_id, String",
    "text": "The actual spoken text, String",
    "timestamp": "Timestamp in debate, String"
}
```

## **How to Run Loader Script**

#### **1. Prerequisites**

- Python 3.6+

- `debate_clean.csv` file in data/ folder

#### **2. Installation**

```bash
python -m pip install "pymongo[srv]"
```

#### **3. Setup Environment**

- Create `.env` file inside the `Debate-Match-RAG` folder and add the following line:

```bash
MONGODB_URI="mongodb+srv://debate_ai:<db_password>@debate-ai-cluster.tu4frag.mongodb.net/?retryWrites=true&w=majority&appName=debate-ai-cluster"
```
- Replace `<db_password>` with the password for the debate_ai database (ask Khang :D)

#### **4. Replace Data File**

- In `main.py`, replace `sample_data.csv` with `debate_clean.csv`

```bash
inserter.process_transcript_file("src/backend/data/sample_data.csv")
```

#### **5. Run the Loader**

```bash
python debate_ai/main.py
```