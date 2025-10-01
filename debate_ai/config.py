import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGODB_URI = os.getenv("MONGODB_URI")
    DATABASE_NAME = "debate_ai"
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")