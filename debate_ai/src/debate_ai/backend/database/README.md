# **Database Setup**

Store clean transcripts in a queryable format.

## **Schema Diagram**

#### **1. speakers**

```json
{
    "speaker_id": "String, Primary Key",
    "name": "String",
    "role": "String"
}
```

#### **2. debates**

```json
{
    "debate_id": "String, Primary Key",
    "name": "String",
    "date": "Date"
}
```

#### **3. utterances**

```json
{
    "utterance_id": "String, Primary Key",
    "debate_id": "String, debates.debate_id",
    "speaker_id": "String, speakers.speaker_id",
    "text": "String",
    "timestamp": "String"
}
```