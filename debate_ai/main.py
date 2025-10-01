from database import DebateDatabase

def main():
    print("Testing MongoDB connection...")
    db = DebateDatabase()
    if db.test_connection():
        print("Database setup complete!")
    db.close_connection()

if __name__ == "__main__":
    main()