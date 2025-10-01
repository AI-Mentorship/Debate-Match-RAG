import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseConfig:
    MONGODB_URI = os.getenv("MONGODB_URI")
    DATABASE_NAME = "debate_ai"