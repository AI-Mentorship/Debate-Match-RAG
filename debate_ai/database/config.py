import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseConfig:
    MONGODB_URI = os.getenv("MONGODB_URI")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    DATABASE_NAME = "debate_ai"